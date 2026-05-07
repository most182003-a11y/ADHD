using ADHD.Application.Commands.ChildCommands;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.ChildHandlers
{
    public class ChildCommandHandler : IRequestHandler<CreateChildCommand, Response<string>>
    {
        private readonly IRepository<Child> _childRepository;
        private readonly ResponseHandler _responseHandler;

        public ChildCommandHandler(IRepository<Child> childRepository, ResponseHandler responseHandler)
        {
            _childRepository = childRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(CreateChildCommand request, CancellationToken cancellationToken)
        {
            var child = new Child
            {
                Name = request.Name,
                Age = request.Age,
                Gender = request.Gender,
                DiagnosisSeverity = request.DiagnosisSeverity,
                Therapist = request.Therapist,
                Status = request.Status,
                AvatarInitials = request.AvatarInitials,
                RegisteredDate = DateTime.UtcNow
            };

            await _childRepository.AddAsync(child);
            return _responseHandler.Success("Child created successfully");
        }
    }
}
