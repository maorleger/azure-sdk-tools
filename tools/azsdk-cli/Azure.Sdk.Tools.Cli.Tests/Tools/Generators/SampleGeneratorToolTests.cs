
using System.CommandLine;
using System.Collections;
using System.IO;
using System.Linq;
using Azure.Sdk.Tools.Cli.Microagents;
using Azure.Sdk.Tools.Cli.Models;
using Azure.Sdk.Tools.Cli.Services;
using Azure.Sdk.Tools.Cli.Tests.Mocks.Helpers;
using Azure.Sdk.Tools.Cli.Tests.TestHelpers;
using Azure.Sdk.Tools.Cli.Tools.Generators;
using Moq;
using NUnit.Framework;

namespace Azure.Sdk.Tools.Cli.Tests.Tools.Generators;

internal class SampleGeneratorToolTests
{
    private SampleGeneratorTool _tool = null!;
    private TestOutputHelper _outputHelper = null!;
    private FakeMicroagentHostService _fakeMicroagent = null!;
    private Mock<ILanguageSpecificCheckResolver> _languageResolver = null!;
    private Mock<IGitHelper> _gitHelper = null!;

    [SetUp]
    public void Setup()
    {
        _outputHelper = new TestOutputHelper();
        _fakeMicroagent = new FakeMicroagentHostService();
        _languageResolver = new Mock<ILanguageSpecificCheckResolver>();
        _gitHelper = new Mock<IGitHelper>();

        _tool = new SampleGeneratorTool(
            new TestLogger<SampleGeneratorTool>(),
            _outputHelper,
            _fakeMicroagent,
            _languageResolver.Object,
            _gitHelper.Object);
    }

    [Test]
    public void GeneratesSamplesToDisk()
    {
        var (repoRoot, packagePath) = CreatePackageDirectory();
        try
        {
            _fakeMicroagent.Samples =
            [
                ("sample.cs", "Upload blob", "// generated sample")
            ];

            _languageResolver
                .Setup(r => r.GetLanguageCheckAsync(packagePath))
                .ReturnsAsync(CreateLanguageCheck("dotnet"));
            _gitHelper.Setup(g => g.DiscoverRepoRoot(packagePath)).Returns(repoRoot.FullName);
            _gitHelper.Setup(g => g.GetRepoName(repoRoot.FullName)).Returns("azure-sdk-for-net");

            var command = _tool.GetCommand();
            var exitCode = command.Invoke($"--package-path \"{packagePath}\" --prompt \"Upload a blob\"");

            Assert.That(exitCode, Is.EqualTo(0));

            var expectedFile = Path.Combine(packagePath, "samples", "sample.cs");
            Assert.That(File.Exists(expectedFile), Is.True, "Sample file should be created");
            Assert.That(File.ReadAllText(expectedFile), Does.Contain("generated sample"));

            var output = _outputHelper.Outputs.First(o => o.Method == nameof(TestOutputHelper.Output)).OutputValue;
            var response = output as SamplesGenerationResponse;
            Assert.That(response, Is.Not.Null);
            Assert.Multiple(() =>
            {
                Assert.That(response!.DryRun, Is.False);
                Assert.That(response.FilesWritten, Does.Contain(expectedFile));
                Assert.That(response.Language, Is.EqualTo("C#"));
            });
        }
        finally
        {
            repoRoot.Delete(recursive: true);
        }
    }

    [Test]
    public void DryRunSkipsFileWrites()
    {
        var (repoRoot, packagePath) = CreatePackageDirectory();
        try
        {
            _fakeMicroagent.Samples =
            [
                ("sample.cs", "Upload blob", "// generated sample")
            ];

            _languageResolver
                .Setup(r => r.GetLanguageCheckAsync(packagePath))
                .ReturnsAsync(CreateLanguageCheck("dotnet"));
            _gitHelper.Setup(g => g.DiscoverRepoRoot(packagePath)).Returns(repoRoot.FullName);
            _gitHelper.Setup(g => g.GetRepoName(repoRoot.FullName)).Returns("azure-sdk-for-net");

            var command = _tool.GetCommand();
            var exitCode = command.Invoke($"--package-path \"{packagePath}\" --prompt \"Dry run\" --dry-run");

            Assert.That(exitCode, Is.EqualTo(0));

            var expectedFile = Path.Combine(packagePath, "samples", "sample.cs");
            Assert.That(File.Exists(expectedFile), Is.False, "Dry run should not write files");

            var response = _outputHelper.Outputs.First(o => o.Method == nameof(TestOutputHelper.Output)).OutputValue as SamplesGenerationResponse;
            Assert.That(response, Is.Not.Null);
            Assert.Multiple(() =>
            {
                Assert.That(response!.DryRun, Is.True);
                Assert.That(response.FilesWritten, Does.Contain(expectedFile));
            });
        }
        finally
        {
            repoRoot.Delete(recursive: true);
        }
    }

    [Test]
    public void MissingPackagePathFails()
    {
        var command = _tool.GetCommand();
        var exitCode = command.Invoke("--package-path \"/non/existent\" --prompt \"noop\"");

        Assert.That(exitCode, Is.EqualTo(1));
        var response = _outputHelper.Outputs.First(o => o.Method == nameof(TestOutputHelper.Output)).OutputValue as SamplesGenerationResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.ResponseError, Does.Contain("does not exist"));
    }

    private static ILanguageSpecificChecks CreateLanguageCheck(string language)
    {
        var mock = new Mock<ILanguageSpecificChecks>();
        mock.SetupGet(m => m.SupportedLanguage).Returns(language);
        mock.Setup(m => m.AnalyzeDependenciesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CLICheckResponse());
        mock.Setup(m => m.UpdateSnippetsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CLICheckResponse());
        return mock.Object;
    }

    private static (DirectoryInfo RepoRoot, string PackagePath) CreatePackageDirectory()
    {
        var repoRoot = Directory.CreateTempSubdirectory("sample-generator-tool-tests");
        var packagePath = Path.Combine(repoRoot.FullName, "sdk", "storage", "Samples.Tests");
        Directory.CreateDirectory(packagePath);
        File.WriteAllText(Path.Combine(packagePath, "sample.env"), "AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true");
        return (repoRoot, packagePath);
    }

    private sealed class FakeMicroagentHostService : IMicroagentHostService
    {
        public IList<(string FileName, string Scenario, string Content)> Samples { get; set; } = new List<(string, string, string)>();

        public Task<TResult> RunAgentToCompletion<TResult>(Microagent<TResult> agentDefinition, CancellationToken ct = default)
        {
            var result = CreateResult<TResult>();
            return Task.FromResult(result);
        }

        private TResult CreateResult<TResult>()
        {
            var resultType = typeof(TResult);
            var instance = Activator.CreateInstance(resultType, nonPublic: true)
                ?? throw new InvalidOperationException($"Unable to instantiate {resultType.FullName}");

            var samplesProperty = resultType.GetProperty("Samples");
            if (samplesProperty != null)
            {
                var elementType = samplesProperty.PropertyType.GetGenericArguments().First();
                var listType = typeof(List<>).MakeGenericType(elementType);
                var list = (IList)Activator.CreateInstance(listType)!;

                var items = Samples.Count == 0
                    ? new List<(string FileName, string Scenario, string Content)> { ("sample.cs", "Scenario", "// sample") }
                    : Samples.ToList();

                foreach (var sample in items)
                {
                    var sampleInstance = Activator.CreateInstance(elementType, nonPublic: true)
                        ?? throw new InvalidOperationException($"Unable to instantiate {elementType.FullName}");
                    elementType.GetProperty("FileName")?.SetValue(sampleInstance, sample.FileName);
                    elementType.GetProperty("Scenario")?.SetValue(sampleInstance, sample.Scenario);
                    elementType.GetProperty("Content")?.SetValue(sampleInstance, sample.Content);
                    list.Add(sampleInstance);
                }

                samplesProperty.SetValue(instance, list);
            }

            return (TResult)instance;
        }
    }
}
