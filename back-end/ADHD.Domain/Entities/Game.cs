using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class Game : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// <summary>
        /// Which metrics are meaningful for this game.
        /// Stored as comma-separated keys, e.g. "ImpulsivityIndex,MotorControlScore"
        /// Used by the frontend to know which columns to show.
        /// </summary>
        public string RelevantMetrics { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public string GameCategoryId { get; set; } = string.Empty;
        public GameCategory? Category { get; set; }

        public ICollection<Session> Sessions { get; set; } = new List<Session>();
    }
}
