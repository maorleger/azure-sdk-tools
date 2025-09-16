
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
using System.CommandLine;
using System.CommandLine.Invocation;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Azure.Sdk.Tools.Cli.Commands;
using Azure.Sdk.Tools.Cli.Contract;
using Azure.Sdk.Tools.Cli.Helpers;
using Azure.Sdk.Tools.Cli.Microagents;
using Azure.Sdk.Tools.Cli.Models;
using Azure.Sdk.Tools.Cli.Services;

namespace Azure.Sdk.Tools.Cli.Tools.Generators;

[McpServerToolType, Description("Generate Azure SDK code samples for a package")]
public class SampleGeneratorTool : MCPTool
{
    private readonly ILogger<SampleGeneratorTool> _logger;
    private readonly IOutputHelper _output;
    private readonly IMicroagentHostService _microagentHostService;
    private readonly ILanguageSpecificCheckResolver _languageCheckResolver;
    private readonly IGitHelper _gitHelper;

    private readonly Option<string> _packagePathOption = new("--package-path", "Path to the Azure SDK package directory")
    {
        IsRequired = true
    };

    private readonly Option<string> _promptOption = new("--prompt", "Description of the sample scenario(s) to generate")
    {
        IsRequired = true
    };

    private readonly Option<string?> _languageOption = new("--language", () => null, "Language override (dotnet|java|js|ts|python|go)");
    private readonly Option<string?> _outputDirectoryOption = new("--output-directory", () => null, "Directory where samples should be written (defaults depend on language)");
    private readonly Option<string?> _templatePathOption = new("--template-path", () => null, "Optional path to a sample template file to prime generation");
    private readonly Option<bool> _verifyOption = new("--verify", () => false, "Verify generated samples (not yet implemented)");
    private readonly Option<bool> _dryRunOption = new("--dry-run", () => false, "Preview planned changes without writing files");
    private readonly Option<bool> _overwriteOption = new("--overwrite", () => false, "Overwrite existing files if present");
    private readonly Option<string> _modelOption = new("--model", () => "gpt-4.1", "Azure OpenAI deployment/model name to use");

    private static readonly Regex ListPrefixRegex = new("^\s*(?:\d+[\.)]|[-*])\s+", RegexOptions.Compiled);
    private static readonly Regex SlugSanitizerRegex = new("[^a-z0-9]+", RegexOptions.Compiled);

    private static readonly Dictionary<string, LanguageMetadata> LanguageMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["dotnet"] = new("C#", "cs", "samples"),
        ["java"] = new("Java", "java", "samples"),
        ["js"] = new("JavaScript", "js", "samples"),
        ["ts"] = new("TypeScript", "ts", "samples"),
        ["python"] = new("Python", "py", "samples"),
        ["go"] = new("Go", "go", "samples")
    };

    private static readonly string[] SampleEnvNames =
    [
        "sample.env",
        ".env.sample",
        "sample.env.template",
        "sample.env.example",
        "samples.env"
    ];

    public SampleGeneratorTool(
        ILogger<SampleGeneratorTool> logger,
        IOutputHelper output,
        IMicroagentHostService microagentHostService,
        ILanguageSpecificCheckResolver languageCheckResolver,
        IGitHelper gitHelper)
    {
        CommandHierarchy = [SharedCommandGroups.Generators];

        _logger = logger;
        _output = output;
        _microagentHostService = microagentHostService;
        _languageCheckResolver = languageCheckResolver;
        _gitHelper = gitHelper;
    }

    public override Command GetCommand()
    {
        var command = new Command("samples", "Generate Azure SDK code samples")
        {
            _packagePathOption,
            _promptOption,
            _languageOption,
            _outputDirectoryOption,
            _templatePathOption,
            _verifyOption,
            _dryRunOption,
            _overwriteOption,
            _modelOption
        };

        command.SetHandler(async ctx => await HandleCommand(ctx, ctx.GetCancellationToken()));
        return command;
    }

    public override async Task HandleCommand(InvocationContext ctx, CancellationToken ct)
    {
        var parseResult = ctx.ParseResult;
        var request = new SampleGenerationRequest
        {
            PackagePath = parseResult.GetValueForOption(_packagePathOption)!,
            Prompt = parseResult.GetValueForOption(_promptOption)!,
            Language = parseResult.GetValueForOption(_languageOption),
            OutputDirectory = parseResult.GetValueForOption(_outputDirectoryOption),
            TemplatePath = parseResult.GetValueForOption(_templatePathOption),
            Verify = parseResult.GetValueForOption(_verifyOption),
            DryRun = parseResult.GetValueForOption(_dryRunOption),
            Overwrite = parseResult.GetValueForOption(_overwriteOption),
            Model = parseResult.GetValueForOption(_modelOption) ?? "gpt-4.1"
        };

        var response = await GenerateSamplesAsync(request, ct);
        ctx.ExitCode = ExitCode;
        _output.Output(response);
    }

    [McpServerTool(Name = "azsdk_generate_samples"), Description("Generate Azure SDK samples for a package path and prompt")]
    public async Task<SamplesGenerationResponse> GenerateSamplesForAgent(
        string packagePath,
        string prompt,
        string? language = null,
        string? outputDirectory = null,
        bool dryRun = false,
        bool overwrite = false,
        string? templatePath = null,
        string? model = null,
        CancellationToken ct = default)
    {
        var request = new SampleGenerationRequest
        {
            PackagePath = packagePath,
            Prompt = prompt,
            Language = language,
            OutputDirectory = outputDirectory,
            TemplatePath = templatePath,
            DryRun = dryRun,
            Overwrite = overwrite,
            Verify = false,
            Model = model ?? "gpt-4.1"
        };

        return await GenerateSamplesAsync(request, ct);
    }

    private async Task<SamplesGenerationResponse> GenerateSamplesAsync(SampleGenerationRequest request, CancellationToken ct)
    {
        try
        {
            ValidateRequest(request);

            var packagePath = Path.GetFullPath(request.PackagePath);
            _logger.LogInformation("Generating samples for package path {PackagePath}", packagePath);

            if (!Directory.Exists(packagePath))
            {
                SetFailure();
                return new SamplesGenerationResponse
                {
                    ResponseError = $"Package path does not exist: {packagePath}"
                };
            }

            if (request.Verify)
            {
                _logger.LogWarning("Verification requested but not implemented yet");
            }

            var detectedLanguage = await DetectLanguageAsync(packagePath, request.Language, ct);
            if (detectedLanguage == null)
            {
                SetFailure();
                return new SamplesGenerationResponse
                {
                    ResponseError = "Unable to determine language for package"
                };
            }

            if (!LanguageMap.TryGetValue(detectedLanguage, out var languageMetadata))
            {
                SetFailure();
                return new SamplesGenerationResponse
                {
                    ResponseError = $"Language '{detectedLanguage}' is not supported"
                };
            }

            var outputRoot = ResolveOutputDirectory(packagePath, request.OutputDirectory, languageMetadata);
            var (_, packageSubPath) = GetPackageInfo(packagePath);
            var scenarios = ParseScenarios(request.Prompt);
            foreach (var scenario in scenarios)
            {
                scenario.FileName = scenario.FileNameWithoutExtension + "." + languageMetadata.DefaultExtension;
            }

            var envVars = ParseSampleEnv(packagePath, out var envWarnings);
            var templateContent = await LoadTemplateAsync(request.TemplatePath, packagePath, ct);

            var agentResult = await RunGenerationAgentAsync(new AgentInputs
            {
                LanguageDisplayName = languageMetadata.DisplayName,
                PackageRelativePath = packageSubPath,
                Scenarios = scenarios,
                Template = templateContent,
                EnvironmentVariables = envVars
            }, request.Model, ct);

            var warnings = new List<string>();
            if (envWarnings.Count > 0)
            {
                warnings.AddRange(envWarnings);
            }

            if (request.Verify)
            {
                warnings.Add("Verification is not yet supported; skipping verify step");
            }

            if (agentResult == null || agentResult.Samples.Count == 0)
            {
                SetFailure();
                return new SamplesGenerationResponse
                {
                    ResponseError = "The generation agent did not return any samples"
                };
            }

            if (agentResult.Samples.Count != scenarios.Count)
            {
                warnings.Add($"Expected {scenarios.Count} samples but agent returned {agentResult.Samples.Count}");
            }

            var environmentNames = envVars.Keys.OrderBy(n => n, StringComparer.OrdinalIgnoreCase).ToList();
            var filesWritten = await WriteSamplesAsync(agentResult.Samples, outputRoot, request.DryRun, request.Overwrite, ct, warnings);

            return new SamplesGenerationResponse
            {
                Language = languageMetadata.DisplayName,
                OutputRoot = outputRoot,
                DryRun = request.DryRun,
                ScenariosGenerated = scenarios.Count,
                FilesWritten = filesWritten,
                Warnings = warnings.Count > 0 ? warnings : null,
                EnvironmentVariablesUsed = environmentNames.Count > 0 ? environmentNames : null
            };
        }
        catch (OperationCanceledException)
        {
            SetFailure();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sample generation failed");
            SetFailure();
            return new SamplesGenerationResponse
            {
                ResponseError = $"Sample generation failed: {ex.Message}"
            };
        }
    }

    private static void ValidateRequest(SampleGenerationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PackagePath))
        {
            throw new ArgumentException("Package path must be provided", nameof(request.PackagePath));
        }

        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            throw new ArgumentException("Prompt must be provided", nameof(request.Prompt));
        }
    }

    private async Task<string?> DetectLanguageAsync(string packagePath, string? overrideLanguage, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(overrideLanguage))
        {
            var normalized = NormalizeLanguage(overrideLanguage);
            if (normalized != null)
            {
                return normalized;
            }

            _logger.LogWarning("Specified language '{Language}' is not recognized", overrideLanguage);
        }

        var languageChecks = await _languageCheckResolver.GetLanguageCheckAsync(packagePath);
        var detected = languageChecks?.SupportedLanguage;
        if (!string.IsNullOrWhiteSpace(detected))
        {
            var normalized = NormalizeLanguage(detected);
            if (normalized != null)
            {
                return normalized;
            }
        }

        try
        {
            var repoRoot = _gitHelper.DiscoverRepoRoot(packagePath);
            var repoName = _gitHelper.GetRepoName(repoRoot);
            var normalized = NormalizeLanguage(repoName);
            if (normalized != null)
            {
                return normalized;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to infer language from repository metadata");
        }

        return null;
    }

    private static string? NormalizeLanguage(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "dotnet" or "c#" or "csharp" or "net" or ".net" => "dotnet",
            "java" => "java",
            "javascript" or "js" => "js",
            "typescript" or "ts" => "ts",
            "python" or "py" => "python",
            "go" or "golang" => "go",
            "azure-sdk-for-net" => "dotnet",
            "azure-sdk-for-java" => "java",
            "azure-sdk-for-js" => "js",
            "azure-sdk-for-python" => "python",
            "azure-sdk-for-go" => "go",
            _ => null
        };
    }

    private static string ResolveOutputDirectory(string packagePath, string? overridePath, LanguageMetadata language)
    {
        if (!string.IsNullOrWhiteSpace(overridePath))
        {
            return Path.IsPathRooted(overridePath)
                ? Path.GetFullPath(overridePath)
                : Path.GetFullPath(Path.Combine(packagePath, overridePath));
        }

        return Path.Combine(packagePath, language.DefaultSamplesFolder);
    }

    private static (string RepoRoot, string PackageSubPath) GetPackageInfo(string packagePath)
    {
        try
        {
            var info = Azure.Sdk.Tools.Cli.Tools.Package.ReadMeGeneratorTool.GetPackageInfoFromPath(packagePath);
            return (info.RepoPath, info.SubPath);
        }
        catch
        {
            var repoRoot = packagePath;
            while (!string.IsNullOrEmpty(repoRoot) && !Directory.Exists(Path.Combine(repoRoot, ".git")))
            {
                repoRoot = Path.GetDirectoryName(repoRoot) ?? string.Empty;
            }

            return (repoRoot, Path.GetRelativePath(repoRoot, packagePath));
        }
    }

    private static List<ScenarioDescription> ParseScenarios(string prompt)
    {
        var trimmed = prompt.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ArgumentException("Prompt cannot be empty", nameof(prompt));
        }

        var lines = trimmed.Replace("", string.Empty).Split('
');
        var scenarioTexts = new List<string>();
        StringBuilder? current = null;

        foreach (var line in lines)
        {
            if (TryParseListLine(line, out var content))
            {
                if (current != null && current.Length > 0)
                {
                    scenarioTexts.Add(current.ToString().Trim());
                }

                current = new StringBuilder(content);
            }
            else if (current != null)
            {
                if (current.Length > 0)
                {
                    current.AppendLine();
                }

                current.Append(line.Trim());
            }
        }

        if (current != null && current.Length > 0)
        {
            scenarioTexts.Add(current.ToString().Trim());
        }

        if (scenarioTexts.Count == 0)
        {
            scenarioTexts.Add(trimmed);
        }

        var scenarios = new List<ScenarioDescription>();
        var usedSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < scenarioTexts.Count; index++)
        {
            var scenarioText = scenarioTexts[index];
            var name = DeriveScenarioName(scenarioText, index);
            var slug = CreateSlug(name);
            var uniqueSlug = EnsureUniqueSlug(slug, usedSlugs);
            scenarios.Add(new ScenarioDescription
            {
                Name = name,
                Description = scenarioText,
                FileNameWithoutExtension = uniqueSlug
            });
        }

        return scenarios;
    }

    private static bool TryParseListLine(string line, out string content)
    {
        var match = ListPrefixRegex.Match(line);
        if (match.Success)
        {
            content = line[match.Length..].Trim();
            return true;
        }

        content = string.Empty;
        return false;
    }

    private static string DeriveScenarioName(string text, int index)
    {
        var trimmed = text.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            return $"Scenario {index + 1}";
        }

        var sentenceEnd = trimmed.IndexOfAny(['.', '!', '?', '
']);
        if (sentenceEnd > 0)
        {
            trimmed = trimmed[..sentenceEnd];
        }

        trimmed = trimmed.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            trimmed = $"Scenario {index + 1}";
        }

        return trimmed;
    }

    private static string CreateSlug(string value)
    {
        var lower = value.ToLowerInvariant();
        var sanitized = SlugSanitizerRegex.Replace(lower, "-").Trim('-');
        return string.IsNullOrEmpty(sanitized) ? "sample" : sanitized;
    }

    private static string EnsureUniqueSlug(string slug, ISet<string> used)
    {
        var candidate = slug;
        var suffix = 2;
        while (!used.Add(candidate))
        {
            candidate = $"{slug}-{suffix++}";
        }

        return candidate;
    }

    private static Dictionary<string, string> ParseSampleEnv(string packagePath, out List<string> warnings)
    {
        warnings = new List<string>();
        foreach (var candidate in SampleEnvNames)
        {
            var filePath = Path.Combine(packagePath, candidate);
            if (!File.Exists(filePath))
            {
                continue;
            }

            try
            {
                var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var line in File.ReadAllLines(filePath))
                {
                    var trimmed = line.Trim();
                    if (trimmed.Length == 0 || trimmed.StartsWith('#'))
                    {
                        continue;
                    }

                    var separatorIndex = trimmed.IndexOf('=');
                    if (separatorIndex <= 0)
                    {
                        warnings.Add($"Skipping malformed environment line in {candidate}: {trimmed}");
                        continue;
                    }

                    var key = trimmed[..separatorIndex].Trim();
                    var value = trimmed[(separatorIndex + 1)..].Trim();
                    if (key.Length == 0)
                    {
                        warnings.Add($"Skipping environment variable with empty name in {candidate}");
                        continue;
                    }

                    result[key] = value;
                }

                if (result.Count == 0)
                {
                    warnings.Add($"No environment variables found in {candidate}");
                }

                return result;
            }
            catch (Exception ex)
            {
                warnings.Add($"Failed to parse {candidate}: {ex.Message}");
            }
        }

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<string?> LoadTemplateAsync(string? templatePath, string packagePath, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(templatePath))
        {
            return null;
        }

        var fullPath = Path.IsPathRooted(templatePath)
            ? templatePath
            : Path.Combine(packagePath, templatePath);

        fullPath = Path.GetFullPath(fullPath);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Template file not found: {fullPath}");
        }

        return await File.ReadAllTextAsync(fullPath, ct);
    }

    private async Task<SampleAgentResult?> RunGenerationAgentAsync(AgentInputs inputs, string model, CancellationToken ct)
    {
        var agentPrompt = BuildAgentPrompt(inputs);

        var microagent = new Microagent<SampleAgentResult>
        {
            Instructions = agentPrompt,
            Model = model,
            MaxToolCalls = 60
        };

        _logger.LogInformation("Invoking generation agent using model {Model}", model);
        return await _microagentHostService.RunAgentToCompletion(microagent, ct);
    }

    private static string BuildAgentPrompt(AgentInputs inputs)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"You are generating Azure SDK samples in {inputs.LanguageDisplayName}.");
        builder.AppendLine("Follow these instructions strictly:");
        builder.AppendLine("- Produce one sample per scenario.");
        builder.AppendLine("- Each sample must target the Azure SDK package located at '" + inputs.PackageRelativePath + "'.");
        builder.AppendLine("- Use idiomatic language patterns and highlight authentication setup with environment variables.");
        builder.AppendLine("- Do not include markdown or commentary; return raw code only in the sample contents.");
        builder.AppendLine("- When reading configuration, prefer environment variable helpers for the language (Environment.GetEnvironmentVariable, os.getenv, process.env, System.getenv, os.Getenv, etc.).");

        if (inputs.EnvironmentVariables.Count > 0)
        {
            builder.AppendLine("Environment variables available (name: example value, leave values as placeholders in code):");
            foreach (var pair in inputs.EnvironmentVariables)
            {
                builder.AppendLine("- " + pair.Key + ": " + pair.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(inputs.Template))
        {
            builder.AppendLine("Use the following template as a starting point and adapt it to the scenario. Keep structure where possible:");
            builder.AppendLine(inputs.Template);
        }

        builder.AppendLine("Scenarios:");
        for (var index = 0; index < inputs.Scenarios.Count; index++)
        {
            var scenario = inputs.Scenarios[index];
            builder.AppendLine($"{index + 1}. {scenario.Name}");
            builder.AppendLine("   Description: " + scenario.Description);
            builder.AppendLine("   File name: " + scenario.FileName);
        }

        builder.AppendLine();
        builder.AppendLine("When you are finished, call the exit tool with a JSON object containing:");
        builder.AppendLine("- samples: list of objects with fields file_name, scenario, and content (raw source code).");
        builder.AppendLine("Ensure file_name exactly matches the requested file names and content contains only source code.");

        return builder.ToString();
    }

    private static async Task<List<string>> WriteSamplesAsync(
        List<GeneratedSample> samples,
        string outputRoot,
        bool dryRun,
        bool overwrite,
        CancellationToken ct,
        List<string> warnings)
    {
        var files = new List<string>();
        var absoluteOutput = Path.GetFullPath(outputRoot);
        if (!dryRun)
        {
            Directory.CreateDirectory(absoluteOutput);
        }

        foreach (var sample in samples)
        {
            if (string.IsNullOrWhiteSpace(sample.FileName))
            {
                warnings.Add("Skipping sample with missing file name");
                continue;
            }

            var targetPath = Path.Combine(absoluteOutput, sample.FileName);
            var fullPath = Path.GetFullPath(targetPath);
            files.Add(fullPath);

            if (!overwrite && File.Exists(fullPath))
            {
                warnings.Add($"Skipped existing file {fullPath}. Use --overwrite to replace.");
                continue;
            }

            if (dryRun)
            {
                continue;
            }

            var directory = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await File.WriteAllTextAsync(fullPath, sample.Content ?? string.Empty, ct);
        }

        return files;
    }

    private record SampleGenerationRequest
    {
        public required string PackagePath { get; init; }
        public required string Prompt { get; init; }
        public string? Language { get; init; }
        public string? OutputDirectory { get; init; }
        public string? TemplatePath { get; init; }
        public bool Verify { get; init; }
        public bool DryRun { get; init; }
        public bool Overwrite { get; init; }
        public required string Model { get; init; }
    }

    private record LanguageMetadata(string DisplayName, string DefaultExtension, string DefaultSamplesFolder);

    private class ScenarioDescription
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string FileNameWithoutExtension { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
    }

    private class AgentInputs
    {
        public string LanguageDisplayName { get; set; } = string.Empty;
        public string PackageRelativePath { get; set; } = string.Empty;
        public List<ScenarioDescription> Scenarios { get; set; } = [];
        public string? Template { get; set; }
        public Dictionary<string, string> EnvironmentVariables { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private class SampleAgentResult
    {
        [Description("List of generated samples")]
        public List<GeneratedSample> Samples { get; set; } = [];
    }

    private class GeneratedSample
    {
        [Description("File name for the sample, including extension")]
        [JsonPropertyName("file_name")]
        public string? FileName { get; set; }

        [Description("Scenario this sample implements")]
        [JsonPropertyName("scenario")]
        public string? Scenario { get; set; }

        [Description("Source code for the sample")]
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }
}
