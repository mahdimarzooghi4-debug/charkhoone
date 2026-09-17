using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Charkhoone.Api.Security;

public static class ApiSecurityExtensions
{
    public static IServiceCollection AddCharkhooneApiSecurity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var securityOptions = ApiSecurityOptions.FromConfiguration(configuration);
        services.AddSingleton(securityOptions);
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers["Retry-After"] = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
                        .ToString(CultureInfo.InvariantCulture);
                }

                context.HttpContext.Response.ContentType = "application/problem+json";
                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    type = "about:blank",
                    title = "Too many requests.",
                    status = StatusCodes.Status429TooManyRequests,
                    code = "rate_limit_exceeded",
                    traceId = System.Diagnostics.Activity.Current?.TraceId.ToString()
                        ?? context.HttpContext.TraceIdentifier,
                }, cancellationToken);
            };

            options.AddPolicy(ApiRateLimitPolicies.SensitiveMutation, httpContext =>
            {
                var subject = httpContext.User.FindFirstValue("sub")?.Trim();
                var partitionKey = !string.IsNullOrWhiteSpace(subject)
                    ? $"subject:{subject}"
                    : $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = securityOptions.PermitLimit,
                        Window = securityOptions.Window,
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });
        });

        return services;
    }

    public static IApplicationBuilder UseCharkhooneApiSecurityHeaders(this IApplicationBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);

        return app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                context.Response.Headers["X-Frame-Options"] = "DENY";
                context.Response.Headers["Referrer-Policy"] = "no-referrer";

                if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.Headers["Cache-Control"] = "no-store";
                    context.Response.Headers["Pragma"] = "no-cache";
                }

                return Task.CompletedTask;
            });

            await next();
        });
    }
}
