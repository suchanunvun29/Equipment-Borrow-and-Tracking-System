using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<EquipmentCategory> EquipmentCategories => Set<EquipmentCategory>();
    public DbSet<BorrowRequest> BorrowRequests => Set<BorrowRequest>();
    public DbSet<ReturnRecord> ReturnRecords => Set<ReturnRecord>();
    public DbSet<SystemUsageLog> SystemUsageLogs => Set<SystemUsageLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Equipment>()
            .HasIndex(e => e.Code)
            .IsUnique();

        modelBuilder.Entity<Equipment>()
            .HasIndex(e => e.Status);

        modelBuilder.Entity<BorrowRequest>()
            .HasIndex(b => b.BorrowerId);

        modelBuilder.Entity<BorrowRequest>()
            .HasIndex(b => b.Status);

        modelBuilder.Entity<BorrowRequest>()
            .HasOne(b => b.ReturnRecord)
            .WithOne(r => r.BorrowRequest)
            .HasForeignKey<ReturnRecord>(r => r.BorrowId);

        modelBuilder.Entity<ReturnRecord>()
            .HasIndex(r => r.BorrowId);

        modelBuilder.Entity<SystemUsageLog>()
            .HasIndex(l => l.CreatedAt);

        modelBuilder.Entity<SystemUsageLog>()
            .HasIndex(l => l.Username);

        base.OnModelCreating(modelBuilder);
    }
}
