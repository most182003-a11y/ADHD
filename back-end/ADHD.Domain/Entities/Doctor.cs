using System.Collections.Generic;

namespace ADHD.Domain.Entities
{
    public class Doctor : AppUser
    {
        public ICollection<Child> Patients { get; set; } = new List<Child>();
    }
}
