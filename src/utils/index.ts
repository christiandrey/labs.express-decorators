export class HttpResponse {
	code: number;
	data: ApiResponse<any>;

	/**
	 *
	 */
	constructor(data?: ApiResponse<any>, code = HttpStatusCodes.ok) {
		this.code = code;
		this.data = data;
	}
}

export const HttpStatusCodes = {
	ok: 200,
	created: 201,
	badRequest: 400,
	unauthorized: 401,
	notFound: 404,
	internalServerError: 500
};

export class ApiResponsePagination {
	total: number;
	count: number;
	perPage: number;
	currentPage: number;
	totalPages: number;

	constructor(dto: Partial<ApiResponsePagination> = {}) {
		this.total = dto.total;
		this.count = dto.count;
		this.perPage = dto.perPage;
		this.currentPage = dto.currentPage;
		this.totalPages = dto.totalPages;
	}
}

export class ApiResponseMeta {
	pagination: ApiResponsePagination;

	constructor(dto: Partial<ApiResponseMeta> = {}) {
		this.pagination = dto.pagination ? new ApiResponsePagination(dto.pagination) : undefined;
	}
}

export class ApiResponseError {
	property: string;
	message: string;

	constructor(dto: Partial<ApiResponseError> = {}) {
		this.property = dto.property;
		this.message = dto.message;
	}
}

export class ApiResponse<T = {}> {
	meta: ApiResponseMeta;
	data: T;
	errors: Array<ApiResponseError>;

	public get status(): boolean {
		return !(this.errors && this.errors.length > 0);
	}

	constructor(dto: Partial<ApiResponse<T>> = {}) {
		this.meta = dto.meta ? new ApiResponseMeta(dto.meta) : undefined;
		this.data = dto.data;
		this.errors = dto.errors ? dto.errors.map(o => new ApiResponseError(o)) : undefined;
	}

	toJSON() {
		const jsonObj = Object.assign({}, this);
		const proto = Object.getPrototypeOf(this);
		for (const key of Object.getOwnPropertyNames(proto)) {
			const desc = Object.getOwnPropertyDescriptor(proto, key);
			const hasGetter = desc && typeof desc.get === "function";
			if (hasGetter) {
				jsonObj[key] = this[key];
			}
		}
		return jsonObj;
	}
}
