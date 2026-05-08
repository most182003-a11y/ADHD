using ADHD.Application.Commands.AuthCommands;
using ADHD.Application.Responses;
using ADHD.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Threading;
using System.Threading.Tasks;

namespace ADHD.Application.Handlers.AuthHandlers
{
    public class AuthCommandHandler : 
        IRequestHandler<RegisterUserCommand, Response<string>>,
        IRequestHandler<LoginCommand, Response<ADHD.Application.DTOs.LoginResponseDto>>
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ResponseHandler _responseHandler;

        public AuthCommandHandler(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, ResponseHandler responseHandler)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _responseHandler = responseHandler;
        }

        public async Task<Response<string>> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
        {
            var user = new AppUser
            {
                UserName = request.UserName,
                Email = request.Email
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return new Response<string>("Registration failed", false)
                {
                    Errors = result.Errors.Select(e => e.Description).ToList()
                };
            }

            if (!string.IsNullOrEmpty(request.Role))
            {
                await _userManager.AddToRoleAsync(user, request.Role);
            }

            return _responseHandler.Success("User registered successfully");
        }

        public async Task<Response<ADHD.Application.DTOs.LoginResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return _responseHandler.BadRequest<ADHD.Application.DTOs.LoginResponseDto>("Invalid email or password");
            }

            var result = await _signInManager.PasswordSignInAsync(user, request.Password, false, false);

            if (!result.Succeeded)
            {
                return _responseHandler.BadRequest<ADHD.Application.DTOs.LoginResponseDto>("Invalid email or password");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Parent";

            var responseDto = new ADHD.Application.DTOs.LoginResponseDto
            {
                Message = "Login successful",
                Role = role
            };

            // For now, returning a simple success message with role. 
            // In a real scenario, you'd return a JWT token here.
            return _responseHandler.Success(responseDto);
        }
    }
}
