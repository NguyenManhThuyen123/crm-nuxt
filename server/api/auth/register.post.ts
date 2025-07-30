import { AuthSchema } from "@/utils/validations";

export default defineEventHandler(async (e) => {
  const { email, password } = await readBody(e);

  try {
    // validate email and password
    await AuthSchema.validate({ email, password });
    // check if account already exist
    const accountExist = await prisma.user.findUnique({ where: { email } });
    if (accountExist) {
      throw createError({
        statusCode: 400,
        message: "This email is taken",
      });
    }
    // hash password
    const hashedPassword = await hashString(password);
    // create user with default SELLER role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'SELLER', // default role
      },
      include: {
        tenant: true
      }
    });
    // create jwt token
    const token = await createToken(user);
    // create http only cookie with token
    setCookie(e, process.env.COOKIE_NAME!, token!, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_EXP_SEC),
      sameSite: "strict",
    });
    // send response without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message,
    });
  }
});
