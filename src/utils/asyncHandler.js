const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}



// const asyncHandler = (fun) => { }
// const asyncHandler = (fun) => { () => { } } if we are passing function inside the function
// const asyncHandler = () => ()=>{}   we car write the above function like this one as well




export {asyncHandler}