using ADHD.Application.Responses;
using MediatR;

namespace ADHD.Application.Commands.ChildCommands
{
    public class CreateChildCommand : IRequest<Response<string>>
    {
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string DiagnosisSeverity { get; set; } = string.Empty;
        public string Therapist { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AvatarInitials { get; set; } = string.Empty;
    }
}
