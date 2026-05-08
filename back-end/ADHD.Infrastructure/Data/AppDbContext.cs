using ADHD.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ADHD.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Child> Children { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Game> Games { get; set; }
        public DbSet<GameCategory> GameCategories { get; set; }
        public DbSet<ChildProgressSnapshot> ChildProgressSnapshots { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Child>(entity =>
            {
                entity.ToTable("children");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.Gender).HasConversion<string>();
                entity.Property(e => e.DiagnosisSeverity).HasConversion<string>();
                entity.Property(e => e.Status).HasConversion<string>();
            });

            modelBuilder.Entity<Session>(entity =>
            {
                entity.ToTable("sessions");
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.Child)
                    .WithMany(c => c.Sessions)
                    .HasForeignKey(e => e.ChildId);

                entity.HasOne(e => e.Game)
                    .WithMany(g => g.Sessions)
                    .HasForeignKey(e => e.GameId);

                entity.Property(e => e.DifficultyLevel).HasConversion<string>();
                entity.Property(e => e.Trend).HasConversion<string>();
                
                entity.HasIndex(e => new { e.ChildId, e.SessionNumber }).IsUnique();
            });

            modelBuilder.Entity<GameCategory>(entity =>
            {
                entity.ToTable("game_categories");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code).IsUnique();
            });

            modelBuilder.Entity<Game>(entity =>
            {
                entity.ToTable("games");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                
                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Games)
                    .HasForeignKey(e => e.GameCategoryId);
            });

            modelBuilder.Entity<ChildProgressSnapshot>(entity =>
            {
                entity.ToTable("child_progress_snapshots");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Child)
                    .WithMany(c => c.ProgressSnapshots)
                    .HasForeignKey(e => e.ChildId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.GameCategory)
                    .WithMany()
                    .HasForeignKey(e => e.GameCategoryId);

                entity.Property(e => e.OverallTrend).HasConversion<string>();

                entity.HasIndex(e => new { e.ChildId, e.GameCategoryId, e.PeriodStart }).IsUnique();
            });
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
