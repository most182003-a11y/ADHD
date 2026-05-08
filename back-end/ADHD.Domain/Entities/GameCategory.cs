using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class GameCategory : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<Game> Games { get; set; } = new List<Game>();
    }
}
