// Este archivo define el contrato de aplicación del módulo Users.
// Aquí deberían declararse los casos de uso consumidos por el controlador.

using JalemosBackend.Modules.Users.Domain;

namespace JalemosBackend.Modules.Users.Application;

public interface IUsersService
{
    // TODO: agregar casos de uso reales para usuarios.
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CreateAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
