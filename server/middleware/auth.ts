export default defineEventHandler(async (event) => {
  // get cookies from the event
  const token = getCookie(event, process.env.COOKIE_NAME!);

  if (token) {
    // if there is a token, verify it
    const decoded = await verifyToken(token);
    if (decoded) {
      // get the user by id with tenant information
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.id },
        include: {
          tenant: true
        }
      });
      // if the token is valid, set the user in the event
      event.context.user = user;
    }
  }

  // check if the route being accessed is protected
  const adminRegex = /\/api\/admin\//gi;
  const sellerRegex = /\/api\/seller\//gi;
  const protectedRegex = /\/admin\//gi;
  
  const isAdminRoute = event.node.req.url && adminRegex.test(event.node.req.url);
  const isSellerRoute = event.node.req.url && sellerRegex.test(event.node.req.url);
  const isProtected = event.node.req.url && protectedRegex.test(event.node.req.url);
  
  // Check authentication for protected routes
  if ((isProtected || isAdminRoute || isSellerRoute) && !event.context.user) {
    return createError({ statusCode: 401, message: "Unauthorized" });
  }
  
  // Check role-based authorization
  if (event.context.user) {
    if (isAdminRoute && event.context.user.role !== 'ADMIN') {
      return createError({ statusCode: 403, message: "Forbidden: Admin access required" });
    }
    
    if (isSellerRoute && event.context.user.role !== 'SELLER' && event.context.user.role !== 'ADMIN') {
      return createError({ statusCode: 403, message: "Forbidden: Seller access required" });
    }
  }
});
