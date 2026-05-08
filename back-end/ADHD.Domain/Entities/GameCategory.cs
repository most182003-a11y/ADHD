using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class GameCategory : BaseEntity
    {
        /// <summary>e.g. "ADHD" or "ATTENTION"</summary>
        public string Code { get; set; } = string.Empty;

        public string NameAr { get; set; } = string.Empty;   // فرط الحركة / قلة التركيز
        public string NameEn { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ICollection<Game> Games { get; set; } = new List<Game>();
    }
}
