import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User } from "../entity/User";
import { Controller, HttpGet, HttpPost, HttpDelete, AuthorizeRoutes, AllowAnonymous, Authorize } from "../decorators";
import { HttpResponse, ApiResponse } from "../utils";

@Controller("users")
export class UserController {
	private userRepository = getRepository(User);

	@HttpGet("")
	@Authorize()
	async all(request: Request, response: Response, next: NextFunction) {
		const data = await this.userRepository.find();
		const apiResponse = new ApiResponse({
			data,
			meta: {
				pagination: {
					total: data.length,
					count: data.length,
					currentPage: 1,
					perPage: 25,
					totalPages: 1
				}
			}
		});
		return new HttpResponse(apiResponse);
	}

	@HttpGet(":id")
	async one(request: Request, response: Response, next: NextFunction) {
		const data = await this.userRepository.findOne(request.params.id);
		return new HttpResponse(new ApiResponse({ data }));
	}

	@HttpPost("")
	async save(request: Request, response: Response, next: NextFunction) {
		const data = await this.userRepository.save(request.body);
		return new HttpResponse(new ApiResponse({ data }));
	}

	@HttpDelete(":id")
	async remove(request: Request, response: Response, next: NextFunction) {
		let userToRemove = await this.userRepository.findOne(request.params.id);
		await this.userRepository.remove(userToRemove);
		return new HttpResponse();
	}
}
