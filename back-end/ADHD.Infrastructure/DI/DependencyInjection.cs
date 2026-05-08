using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using ADHD.Infrastructure.Data;
using ADHD.Infrastructure.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Globalization;

namespace ADHD.Infrastructure.DI
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddIdentity<AppUser, IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            ConfigureLocalizationOptions(services);

            return services;
        }

        public static void UseSharedCulture(this IApplicationBuilder app)
        {
            app.Use(async (context, next) =>
            {
                var culture = context.Request.Query["culture"];
                if (!string.IsNullOrWhiteSpace(culture))
                {
                    CultureInfo cultureInfo = new CultureInfo(culture!);
                    CultureInfo.CurrentCulture = cultureInfo;
                    CultureInfo.CurrentUICulture = cultureInfo;
                }
                await next();
            });
        }

        private static void ConfigureLocalizationOptions(IServiceCollection services)
        {
            services.AddLocalization(options => options.ResourcesPath = "");

            services.Configure<RequestLocalizationOptions>(options =>
            {
                var supportedCultures = new[]
                {
                    new CultureInfo("en-US"),
                    new CultureInfo("ar-EG"),
                 };

                options.DefaultRequestCulture = new RequestCulture("en-US");
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;
            });
        }
    }
}
