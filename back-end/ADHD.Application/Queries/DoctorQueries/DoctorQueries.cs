using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using MediatR;
using System.Collections.Generic;

namespace ADHD.Application.Queries.DoctorQueries
{
    public class GetDoctorListQuery : IRequest<Response<IEnumerable<Doctor>>>
    {
    }

    public class GetDoctorByIdQuery : IRequest<Response<Doctor>>
    {
        public string Id { get; set; } = string.Empty;
    }
}
