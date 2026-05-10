using ADHD.Application.Commands.DoctorCommands;
using ADHD.Application.Queries.DoctorQueries;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using ADHD.Domain.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.DoctorHandlers
{
    public class DoctorCommandHandler : IRequestHandler<CreateDoctorCommand, Response<string>>
    {
        private readonly IRepository<Doctor> _doctorRepository;
        private readonly ResponseHandler _responseHandler;

        public DoctorCommandHandler(IRepository<Doctor> doctorRepository, ResponseHandler responseHandler)
        {
            _doctorRepository = doctorRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(CreateDoctorCommand request, CancellationToken cancellationToken)
        {
            var doctor = new Doctor
            {
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber
            };

            await _doctorRepository.AddAsync(doctor);
            return _responseHandler.Success("Doctor created successfully");
        }
    }

    public class DoctorQueryHandler : 
        IRequestHandler<GetDoctorListQuery, Response<IEnumerable<Doctor>>>,
        IRequestHandler<GetDoctorByIdQuery, Response<Doctor>>
    {
        private readonly IRepository<Doctor> _doctorRepository;
        private readonly ResponseHandler _responseHandler;

        public DoctorQueryHandler(IRepository<Doctor> doctorRepository, ResponseHandler responseHandler)
        {
            _doctorRepository = doctorRepository;
            _responseHandler = responseHandler;
        }

        public async Task<Response<IEnumerable<Doctor>>> Handle(GetDoctorListQuery request, CancellationToken cancellationToken)
        {
            var doctors = await _doctorRepository.GetAllAsync();
            return _responseHandler.Success(doctors);
        }

        public async Task<Response<Doctor>> Handle(GetDoctorByIdQuery request, CancellationToken cancellationToken)
        {
            var doctor = await _doctorRepository.GetByIdAsync(request.Id);
            return doctor != null ? _responseHandler.Success(doctor) : _responseHandler.NotFound<Doctor>("Doctor not found");
        }
    }
}
