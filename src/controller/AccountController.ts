import * as bcrypt from "bcrypt";
import { Controller, HttpPost, Logger } from "../decorators";
import { Request, Response, NextFunction } from "express";
import { AuthenticateUser, GetSignedToken } from "../auth";
import { User } from "../entity/User";
import { getRepository } from "typeorm";
import { HttpResponse, ApiResponse, ApiResponseError, HttpStatusCodes } from "../utils";

@Controller("account")
export class AccountController {
	private userRepository = getRepository(User);

	@HttpPost("login")
	@Logger()
	async login(request: Request, response: Response, next: NextFunction) {
		try {
			const token = await AuthenticateUser(request, response);
			return new HttpResponse(new ApiResponse({ data: token }));
		} catch (error) {
			return new HttpResponse(
				new ApiResponse({
					errors: [
						new ApiResponseError({
							message: error.message
						})
					]
				}),
				HttpStatusCodes.badRequest
			);
		}
	}

	@HttpPost("register")
	async register(request: Request, response: Response, next: NextFunction) {
		const user = new User(request.body);
		user.passwordHash = await bcrypt.hash(user.password, 2);
		const createdUser = await this.userRepository.save(user);
		const token = await GetSignedToken(createdUser, "loremIPSUM");
		return new HttpResponse(new ApiResponse({ data: token }));
	}
}
