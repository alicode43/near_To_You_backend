class ApiError extends Error {
    constructor(
        statusCode,
        message="Kuch to gadbad hai daya",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data=null
        this.message = message
        this.success = false
        this.errors =errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStack(this, this.contructor)
        }
    }
}

export {ApiError}