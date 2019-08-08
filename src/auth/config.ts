import * as bcrypt from "bcrypt";
import * as passport from "passport";
import * as passportLocal from "passport-local";

import { Repository } from "typeorm";
import { ElfUser, ElfRole } from "./entities";
import { isEmail } from "./utils";
import { ExtractJwt, VerifiedCallback, Strategy } from "passport-jwt";

const LOCAL_STRATEGY = passportLocal.Strategy;

export function InitializeAuthentication<T extends ElfUser>(userRepository: Repository<T>, secretOrPrivateKey: string) {
	// ---------------------------------------------------
	// LOCAL STRATEGY
	// ---------------------------------------------------

	passport.use(
		new LOCAL_STRATEGY(
			{
				usernameField: "email",
				passwordField: "password"
			},
			async (email: string, password: string, callback: any) => {
				const validationResult = isEmail(email);

				if (!validationResult) {
					return callback(null, null, {
						message: "Email address is not valid."
					});
				}

				const user = await userRepository.findOne({ where: { email } });

				if (!!user) {
					const passwordValidationResult = await bcrypt.compare(password, user.passwordHash);
					if (passwordValidationResult) {
						return callback(null, user, {
							message: "Logged in successfully."
						});
					}
				}

				return callback(null, null, {
					message: "Incorrect email or password."
				});
			}
		)
	);

	// ---------------------------------------------------
	// BEARER RULE
	// ---------------------------------------------------
	passport.use(
		"bearer-rule",
		new Strategy(
			{
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
				secretOrKey: secretOrPrivateKey
			},
			async (jwtPayload: any, done: VerifiedCallback) => {
				const id = jwtPayload.sub;
				const user = await userRepository.findOne({ where: { id } });

				if (!!user) {
					const { id } = user;
					const role = user["role"] as ElfRole;
					const authenticatedUser = { id } as T;

					if (!!role) {
						authenticatedUser["role"] = role;
					}

					return done(null, authenticatedUser);
				}

				return done(null, null);
			}
		)
	);
}
