using ADHD.Application.Commands.ParentCommands;
using ADHD.Application.Queries.ParentQueries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ADHD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ParentsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateParent([FromBody] CreateParentCommand command)
        {
            var result = await _mediator.Send(command);
            return result.Succeeded == true ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllParents()
        {
            var query = new GetParentListQuery();
            var result = await _mediator.Send(query);
            return result.Succeeded == true ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetParentById(string id)
        {
            var query = new GetParentByIdQuery { Id = id };
            var result = await _mediator.Send(query);
            return result.Succeeded == true ? Ok(result) : NotFound(result);
        }
    }
}
