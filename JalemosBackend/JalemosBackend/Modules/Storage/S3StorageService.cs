using Amazon.S3;
using Amazon.S3.Model;

namespace JalemosBackend.Modules.Storage;

public sealed class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly string    _bucket;

    public S3StorageService(IConfiguration config)
    {
        var section = config.GetSection("AWS");
        _bucket = section["BucketName"]
            ?? throw new InvalidOperationException("AWS:BucketName is required in configuration.");

        _s3 = new AmazonS3Client(
            section["AccessKey"]
                ?? throw new InvalidOperationException("AWS:AccessKey is required."),
            section["SecretKey"]
                ?? throw new InvalidOperationException("AWS:SecretKey is required."),
            new AmazonS3Config
            {
                RegionEndpoint  = Amazon.RegionEndpoint.GetBySystemName(section["Region"] ?? "us-east-1"),
                ForcePathStyle  = false,
            }
        );
    }

    public async Task<string?> UploadBase64Async(string? base64Data, string folder, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(base64Data)) return null;

        // Already a public URL (e.g., during resubmit when photo hasn't changed) — skip upload
        if (base64Data.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return base64Data;

        // Strip "data:image/jpeg;base64," prefix if present
        var cleanBase64 = base64Data.Contains(',') ? base64Data.Split(',')[1] : base64Data;

        byte[] bytes;
        try { bytes = Convert.FromBase64String(cleanBase64); }
        catch (FormatException ex)
        {
            throw new InvalidOperationException("La imagen tiene un formato base64 inválido.", ex);
        }

        var key = $"{folder}/{Guid.NewGuid()}.jpg";

        using var stream = new MemoryStream(bytes);
        var request = new PutObjectRequest
        {
            BucketName  = _bucket,
            Key         = key,
            InputStream = stream,
            ContentType = "image/jpeg",
        };

        await _s3.PutObjectAsync(request, ct);
        return $"https://{_bucket}.s3.amazonaws.com/{key}";
    }
}
