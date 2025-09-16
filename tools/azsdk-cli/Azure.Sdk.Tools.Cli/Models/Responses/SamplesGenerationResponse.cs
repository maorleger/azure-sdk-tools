// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
using System.Text;
using System.Text.Json.Serialization;

namespace Azure.Sdk.Tools.Cli.Models;

public class SamplesGenerationResponse : Response
{
    [JsonPropertyName("language")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Language { get; set; }

    [JsonPropertyName("output_root")]
    public string OutputRoot { get; set; } = string.Empty;

    [JsonPropertyName("dry_run")]
    public bool DryRun { get; set; }

    [JsonPropertyName("scenarios_generated")]
    public int ScenariosGenerated { get; set; }

    [JsonPropertyName("files_written")]
    public List<string> FilesWritten { get; set; } = [];

    [JsonPropertyName("warnings")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<string>? Warnings { get; set; }

    [JsonPropertyName("environment_variables_used")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<string>? EnvironmentVariablesUsed { get; set; }

    public override string ToString()
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Language: {Language ?? "unknown"}");
        sb.AppendLine($"Output root: {OutputRoot}");
        sb.AppendLine($"Scenarios generated: {ScenariosGenerated}");
        sb.AppendLine(DryRun ? "Dry run: files not written" : "Dry run: false");

        if (FilesWritten.Count > 0)
        {
            sb.AppendLine("Files:");
            foreach (var file in FilesWritten)
            {
                sb.AppendLine($"  - {file}");
            }
        }

        if (Warnings is { Count: > 0 })
        {
            sb.AppendLine("Warnings:");
            foreach (var warning in Warnings)
            {
                sb.AppendLine($"  - {warning}");
            }
        }

        return ToString(sb);
    }
}
