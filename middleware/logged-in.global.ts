export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useUser();
  const { getRoleBasedRedirect } = useAuth();
  
  // check if the user is logged in and trying to access login/register pages
  if (user.value && (to.path == "/" || to.path == "/register")) {
    return await navigateTo(getRoleBasedRedirect());
  }
  
  // check if the user is not logged in and trying to access protected routes
  if (!user.value && (to.path.match(/^\/admin\//gi) || to.path.match(/^\/seller\//gi))) {
    return await navigateTo("/");
  }
  
  // check role-based access for admin routes
  if (user.value && to.path.match(/^\/admin\//gi) && user.value.role !== 'ADMIN') {
    return await navigateTo("/seller");
  }
  
  // check role-based access for seller routes
  if (user.value && to.path.match(/^\/seller\//gi) && user.value.role !== 'SELLER' && user.value.role !== 'ADMIN') {
    return await navigateTo("/");
  }
});
