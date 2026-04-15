using NorthShift.Api.Models;
using Resend;

namespace NorthShift.Api.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger, IResend resend)
{
    private readonly string _fromEmail = config["Resend:FromEmail"] ?? "hello@northshift.ca";
    private readonly string _fromName = config["Resend:FromName"] ?? "NorthShift Jobs";

    public async Task SendListingConfirmationAsync(OrgUser postedBy, Listing listing)
    {
        var subject = $"Your listing is live: {listing.TitleEn ?? listing.TitleFr}";
        var body = $"""
            <h2>Your job listing is now live!</h2>
            <p>Hi {postedBy.Name},</p>
            <p>Your listing <strong>{listing.TitleEn ?? listing.TitleFr}</strong> in {listing.Community}, {listing.Province} is now active.</p>
            <p>It will remain live until {listing.ExpiresAt:MMMM d, yyyy}.</p>
            <p><a href="{config["Frontend:Url"]}/jobs/{listing.Slug}">View your listing</a></p>
            <p>Thanks,<br/>NorthShift Jobs</p>
            """;

        await SendEmailAsync(postedBy.Email, subject, body);
    }

    public async Task SendAlertSubscriptionConfirmationAsync(string toEmail, string unsubscribeToken)
    {
        var subject = "You're subscribed to NorthShift job alerts";
        var body = $"""
            <h2>Job alerts confirmed!</h2>
            <p>You're now subscribed to NorthShift job alerts. We'll email you when new contract nursing positions match your preferences.</p>
            <p>Each alert email includes a one-click unsubscribe link.</p>
            <hr/>
            <p style="font-size:12px;color:#999;">
                Don't want these emails? <a href="{config["Frontend:Url"]}/alerts/unsubscribe?token={unsubscribeToken}">Unsubscribe</a>
            </p>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendAlertEmailAsync(string toEmail, Listing listing, string unsubscribeToken)
    {
        var subject = $"New nursing contract: {listing.TitleEn ?? listing.TitleFr} — {listing.Community}, {listing.Province}";
        var body = $"""
            <h2>New contract match for you</h2>
            <p>A new listing matches your alert preferences:</p>
            <h3>{listing.TitleEn ?? listing.TitleFr}</h3>
            <ul>
                <li><strong>Location:</strong> {listing.Community}, {listing.Province}</li>
                <li><strong>Role:</strong> {string.Join(", ", listing.RoleTypes)}</li>
                <li><strong>Contract:</strong> {listing.ContractLength}</li>
                <li><strong>Housing:</strong> {(listing.HousingProvided ? "Provided" : "Not provided")}</li>
                <li><strong>Travel:</strong> {(listing.TravelCovered ? "Covered" : "Not covered")}</li>
            </ul>
            <p><a href="{config["Frontend:Url"]}/jobs/{listing.Slug}">View full listing</a></p>
            <hr/>
            <p style="font-size:12px;color:#999;">
                <a href="{config["Frontend:Url"]}/alerts/unsubscribe?token={unsubscribeToken}">Unsubscribe from alerts</a>
            </p>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendApplicationConfirmationAsync(Application application, Listing listing)
    {
        var subject = $"Application received — {listing.TitleEn ?? listing.TitleFr}";
        var body = $"""
            <h2>We received your application!</h2>
            <p>Hi {application.ApplicantName},</p>
            <p>Your application for <strong>{listing.TitleEn ?? listing.TitleFr}</strong> in {listing.Community}, {listing.Province} has been received.</p>
            <p>The employer will be in touch if your profile is a match.</p>
            <p>Thanks,<br/>NorthShift Jobs</p>
            """;

        await SendEmailAsync(application.ApplicantEmail, subject, body);
    }

    public async Task SendNewApplicationNotificationAsync(AccountManager accountManager, Application application, Listing listing)
    {
        var subject = $"New application: {listing.TitleEn ?? listing.TitleFr}";
        var body = $"""
            <h2>New application received</h2>
            <p>Hi {accountManager.Name},</p>
            <p><strong>{application.ApplicantName}</strong> has applied for <strong>{listing.TitleEn ?? listing.TitleFr}</strong>.</p>
            <p><a href="{config["Frontend:Url"]}/dashboard/applications/{application.Id}">View application</a></p>
            <p>NorthShift Jobs</p>
            """;

        await SendEmailAsync(accountManager.Email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var subject = "Reset your NorthShift password";
        var resetUrl = $"{config["Frontend:Url"]}/en/reset-password?token={resetToken}";
        var body = $"""
            <h2>Reset your password</h2>
            <p>We received a request to reset the password for your NorthShift account.</p>
            <p><a href="{resetUrl}" style="display:inline-block;padding:10px 20px;background:#0070f3;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
            <p>This link expires in 1 hour. If you didn't request a reset, you can ignore this email — your password won't change.</p>
            <p>NorthShift Jobs</p>
            """;

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendInviteEmailAsync(Recruiter recruiter, Organization org)
    {
        var subject = $"You've been invited to join {org.Name} on NorthShift Jobs";
        var body = $"""
            <h2>You're invited!</h2>
            <p>Hi {recruiter.Name},</p>
            <p>You've been invited to join <strong>{org.Name}</strong> as a recruiter on NorthShift Jobs.</p>
            <p><a href="{config["Frontend:Url"]}/auth/accept-invite?token={recruiter.InviteToken}">Accept your invitation</a></p>
            <p>This link will expire in 7 days.</p>
            <p>NorthShift Jobs</p>
            """;

        await SendEmailAsync(recruiter.Email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        try
        {
            var message = new EmailMessage
            {
                From = $"{_fromName} <{_fromEmail}>",
                To = { to },
                Subject = subject,
                HtmlBody = htmlBody
            };
            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To} with subject {Subject}", to, subject);
        }
    }
}
