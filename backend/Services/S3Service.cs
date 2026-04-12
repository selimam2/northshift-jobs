using Amazon.S3;
using Amazon.S3.Model;

namespace NorthShift.Api.Services;

public class S3Service
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public S3Service(IAmazonS3 s3, IConfiguration config)
    {
        _s3 = s3;
        _bucket = config["AWS:ResumeBucket"] ?? throw new InvalidOperationException("AWS:ResumeBucket not configured");
    }

    /// <summary>Returns a presigned PUT URL and the S3 key to store on the application.</summary>
    public string GenerateUploadUrl(string s3Key, TimeSpan expiry)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key        = s3Key,
            Verb       = HttpVerb.PUT,
            Expires    = DateTime.UtcNow.Add(expiry),
            ContentType = "application/octet-stream",
        };
        return _s3.GetPreSignedURL(request);
    }

    /// <summary>Returns a presigned GET URL so org members can download the resume.</summary>
    public string GenerateDownloadUrl(string s3Key, TimeSpan expiry)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key        = s3Key,
            Verb       = HttpVerb.GET,
            Expires    = DateTime.UtcNow.Add(expiry),
        };
        return _s3.GetPreSignedURL(request);
    }
}
