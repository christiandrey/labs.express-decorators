import * as JWT from "jsonwebtoken";
import * as passport from "passport";
import { ElfUser, ElfRole, IJwtPayloadUserDetails, JwtPayload, TokenResponse } from "./entities";
import { Request, Response } from "express";
import { IVerifyOptions } from "passport-local";

export const AuthorizeUser = passport.authenticate("bearer-rule", { session: false });

export const AuthenticateUser = (req: Request, resp: Response) => {
	return new Promise<TokenResponse>((resolve, reject) => {
		passport.authenticate("local", { session: false }, async (error, user: ElfUser, info: IVerifyOptions) => {
			if (!!error) {
				return reject(new Error(error.toString()));
			}

			if (!user) {
				return reject(new Error(info.message));
			}

			try {
				const token = await CreateUserSession(req, user);
				return resolve(token);
			} catch (error) {
				return reject(error);
			}
		})(req, resp);
	});
};

export const CreateUserSession = (req: Request, user: ElfUser) => {
	return new Promise<TokenResponse>((resolve, reject) => {
		req.login(user, { session: false }, error => {
			if (!!error) {
				return reject(new Error(error.toString()));
			}
			const token = GetSignedToken(user, "loremIPSUM");
			return resolve(new TokenResponse(token));
		});
	});
};

export const GetSignedToken = (user: ElfUser, secretOrPrivateKey: string, rest?: IJwtPayloadUserDetails, expiresIn: string = "7 days") => {
	const { id, email, emailVerified } = user;
	const role = user["role"] as ElfRole;

	let payload = {
		sub: id,
		authTime: Date.now(),
		email,
		emailVerified,
		role: !!role ? role.name : undefined
	} as JwtPayload;

	if (!!rest) payload = Object.assign(payload, rest);
	if (!!role) payload = Object.assign(payload, { role: role.name });

	return JWT.sign(payload, secretOrPrivateKey, { expiresIn });
};

export const AuthorizeUserRoles = (req: Request, allowedRoles: Array<string>) => {
	const user = req.user as ElfUser;
	const role = user["role"] as ElfRole;

	if (!allowedRoles || allowedRoles.length < 1) return;
	if (!allowedRoles.includes(role.name)) throw new Error();
};

export const AuthorizeUsers = (req: Request, allowedUsers: Array<string>) => {
	const user = req.user as ElfUser;

	if (!allowedUsers || allowedUsers.length < 1) return;
	if (!allowedUsers.includes(user.id)) throw new Error();
};
