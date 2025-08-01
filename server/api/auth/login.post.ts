import { AuthSchema } from "@/utils/validations";

export default defineEventHandler(async (e) => {
  const { email, password } = await readBody(e);

  try {
    // validate email and password
    await AuthSchema.validate({ email, password });
    // check if account already exist and include tenant information
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        tenant: true
      }
    });
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }
    // check if password is correct
    const isPasswordCorrect = await compareString(password, user.password);
    if (!isPasswordCorrect) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }
    // create jwt token
    const token = await createToken(user);
    // create http only cookie with token
    setCookie(e, process.env.COOKIE_NAME!, token!, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_EXP_SEC),
      sameSite: "strict",
    });
    // send response with role-based information
    const { password: userPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message,
    });
  }
});
