namespace JalemosBackend.Modules.Users.Domain
{
    // driver means the user is verified to offer rides AND can still search as a passenger.
    // Stored in the DB as VARCHAR(20): "admin" | "passenger" | "driver".
    public enum UserRole { admin, passenger, driver }
}
