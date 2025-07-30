import type { User, Tenant } from "@prisma/client";
import type { TAuth } from "~/types";

type UserWithTenant = User & { tenant?: Tenant | null };

export const useUser = () => useState<UserWithTenant | undefined>("CRM_USER");
export const useAuth = () => {
  const user = useUser();

  // document this function
  /**
   * Method to register a new user
   * @param data {TAuth} - The user data to register
   * @returns {Promise<UserWithTenant>} - The response from the API
   * @example
   * const { register } = useAuth()
   * const data = {
   * email: "janedoe@example.com"
   * password: "123456789"
   * }
   * const response = await register(data)
   * console.log(response)
   *
   */
  const register = async (data: TAuth) => {
    try {
      const res = await $fetch<UserWithTenant | undefined>("/api/auth/register", {
        method: "POST",
        body: data,
      });
      user.value = res;
      return res;
    } catch (error: any) {
      throw error.data;
    }
  };
  /**
   * Method to login a user
   * @param data {TAuth} - The user data to login
   * @returns {Promise<UserWithTenant>} - The response from the API
   * @example
   * const { login } = useAuth()
   * const data = {
   * email: "john@example.com",
   * password: "123456789"
   * }
   * const response = await login(data)
   */
  const login = async (data: TAuth) => {
    try {
      const res = await $fetch<UserWithTenant | undefined>("/api/auth/login", {
        method: "POST",
        body: data,
      });
      user.value = res;
      return res;
    } catch (error: any) {
      throw error.data;
    }
  };

  /**
   * Method to logout a user
   * @returns {Promise<boolean>} - The response from the API
   * @example
   * const { logoutUser } = useAuth()
   * const response = await logoutUser()
   * console.log(response)
   */
  const logoutUser = async () => {
    try {
      await $fetch("/api/auth/logout");
      user.value = undefined;
      return true;
    } catch (error: any) {
      throw error.data;
    }
  };

  /**
   * Method to get the current user
   * @returns {Promise<UserWithTenant | undefined>} - The response from the API
   * @example
   * const { getMe } = useAuth()
   * const response = await getMe()
   * console.log(response)
   */
  const getMe = async () => {
    try {
      const res = await $fetch<UserWithTenant | undefined>("/api/auth/me", {
        headers: useRequestHeaders(),
        credentials: "include",
      });
      if (res?.id) user.value = res;
      return res?.id ? res : undefined;
    } catch (error: any) {
      throw error.data;
    }
  };

  /**
   * Method to check if user has admin role
   * @returns {boolean} - True if user is admin
   */
  const isAdmin = () => {
    return user.value?.role === 'ADMIN';
  };

  /**
   * Method to check if user has seller role
   * @returns {boolean} - True if user is seller
   */
  const isSeller = () => {
    return user.value?.role === 'SELLER';
  };

  /**
   * Method to get user's tenant ID
   * @returns {string | null} - User's tenant ID or null
   */
  const getTenantId = () => {
    return user.value?.tenantId || null;
  };

  /**
   * Method to get role-based redirect path after login
   * @returns {string} - Redirect path based on user role
   */
  const getRoleBasedRedirect = () => {
    if (isAdmin()) {
      return '/admin';
    } else if (isSeller()) {
      return '/seller';
    }
    return '/admin/contacts'; // fallback to existing behavior
  };

  return { 
    register, 
    login, 
    getMe, 
    logoutUser, 
    isAdmin, 
    isSeller, 
    getTenantId, 
    getRoleBasedRedirect 
  };
};
