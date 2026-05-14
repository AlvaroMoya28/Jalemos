// Este archivo contiene la lógica de aplicación del módulo Users.
// Aquí deberían coordinarse validaciones y reglas del negocio del usuario.

using JalemosBackend.Modules.Users.Domain;
using JalemosBackend.Modules.Users.Infrastructure;

namespace JalemosBackend.Modules.Users.Application;

public sealed class UsersService : IUsersService
{
    private readonly UsersRepository _repository;

    public UsersService(UsersRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    public Task CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        return _repository.CreateAsync(user, cancellationToken);
    }

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(user, cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
