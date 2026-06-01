namespace JalemosBackend.Modules.Storage;

public interface IStorageService
{
    // Returns the public S3 URL, or null if base64Data is null/empty.
    Task<string?> UploadBase64Async(string? base64Data, string folder, CancellationToken ct = default);
}
