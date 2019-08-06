import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User } from "../entity/User";
import { Controller, HttpGet, HttpPost, HttpDelete } from "../decorators";

@Controller("users")
export class UserController {
	private userRepository = getRepository(User);

	@HttpGet("")
	async all(request: Request, response: Response, next: NextFunction) {
		return this.userRepository.find();
	}

	@HttpGet(":id")
	async one(request: Request, response: Response, next: NextFunction) {
		return this.userRepository.findOne(request.params.id);
	}

	@HttpPost("")
	async save(request: Request, response: Response, next: NextFunction) {
		return this.userRepository.save(request.body);
	}

	@HttpDelete(":id")
	async remove(request: Request, response: Response, next: NextFunction) {
		let userToRemove = await this.userRepository.findOne(request.params.id);
		await this.userRepository.remove(userToRemove);
	}
}
