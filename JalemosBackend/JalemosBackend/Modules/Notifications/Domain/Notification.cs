// Domain entity for the Notifications module.
// Models a single in-app notification sent to a user.

namespace JalemosBackend.Modules.Notifications.Domain;

/// <summary>
/// Represents a notification delivered to a user (e.g., booking confirmation, new message, rating received).
/// </summary>
public sealed class Notification
{
    // TODO: Add RecipientId, Title, Body, Type (Ride/Offer/Message/Rating),
    //       IsRead, SentAt, and a MarkAsRead() domain method.
    public Guid Id { get; set; }
}
