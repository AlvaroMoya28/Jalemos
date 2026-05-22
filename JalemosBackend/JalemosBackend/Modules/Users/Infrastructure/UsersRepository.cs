using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure.Entities;

namespace JalemosBackend.Modules.Users.Infrastructure
{
    public sealed class UsersRepository
    {
        private readonly ApplicationDbContext _dbContext;
        public UsersRepository(ApplicationDbContext dbContext) => _dbContext = dbContext;
        
        // Maps between UserEntity (the EF Core entity) and User (the domain model).
        private static User MapToDomain(UserEntity e) => new User
        {
            Id = e.UserId,
            Name = e.Name,
            Email = e.Email,
            PasswordHash = e.Password,
            MeanRating = e.MeanRating,
            TotalTrips = e.TotalTrips,
            Kms = e.Kms,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };

        // Maps from the domain model to the EF Core entity.
        private static void MapToEntity(UserEntity e, User u)
        {
            e.Name = u.Name;
            e.Email = u.Email;
            if (!string.IsNullOrWhiteSpace(u.PasswordHash)) e.Password = u.PasswordHash;
            e.MeanRating = u.MeanRating;
            e.TotalTrips = u.TotalTrips;
            e.Kms = u.Kms;
        }

        // Repository methods for CRUD operations on users.
        // These are called by the service layer, which contains the business logic and validation.
        public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.Users.AsNoTracking()
                .Select(e => MapToDomain(e))
                .ToListAsync(cancellationToken);
        }

        public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var e = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == id, cancellationToken);
            return e is null ? null : MapToDomain(e);
        }

        public async Task CreateAsync(User user, CancellationToken cancellationToken = default)
        {
            var entity = new UserEntity
            {
                UserId = user.Id == Guid.Empty ? Guid.NewGuid() : user.Id,
                Name = user.Name,
                Email = user.Email,
                Password = user.PasswordHash ?? string.Empty,
                MeanRating = user.MeanRating,
                TotalTrips = user.TotalTrips,
                Kms = user.Kms,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
            user.Id = entity.UserId;
        }

        public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
            if (entity is null) throw new KeyNotFoundException("User not found");

            MapToEntity(entity, user);
            entity.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var entity = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id, cancellationToken);
            if (entity is null) return;
            _dbContext.Users.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}