using JalemosBackend.Modules.Ratings.Application.DTOs;
using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Application;

public interface IRatingsService
{
    Task<IEnumerable<Rating>> GetAllAsync(CancellationToken ct = default);
    Task<Rating?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<RatingDto>> GetByRatedUserAsync(Guid ratedId, CancellationToken ct = default);
    Task<RatingDto> SubmitAsync(SubmitRatingDto dto, Guid raterId, CancellationToken ct = default);
    Task DeleteAsync(Guid id, Guid callerId, CancellationToken ct = default);
}
