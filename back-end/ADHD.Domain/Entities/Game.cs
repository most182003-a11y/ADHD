using System;

namespace ADHD.Domain.Entities
{
    public class Game : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        
        // e.g., "فرط الحركة" (Hyperactivity) or "قلة التركيز" (Inattention)
        public string Category { get; set; } = string.Empty; 
        
        public string? Description { get; set; }
    }
}
