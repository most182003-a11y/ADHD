using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class Game : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        
        public string GameCategoryId { get; set; } = string.Empty;
        public GameCategory? Category { get; set; }
        
        public string? Description { get; set; }

        public ICollection<Session> Sessions { get; set; } = new List<Session>();
    }
}
