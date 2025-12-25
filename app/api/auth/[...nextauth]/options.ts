import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { SignInError } from '@/enums/errors-and-statuses';


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            id: 'credentials',
            credentials: {
                universityid: {
                    label: 'University ID',
                    type: 'text'
                },
                password: {
                    label: 'Password',
                    type: 'password'
                }
            },
            async authorize(credentials: any): Promise<any> {
                try {
                    const prisma = new PrismaClient();
                    const user = await prisma.user.findFirst({
                        where: {
                            universityid: credentials.universityid
                        }
                    })
                    if (!user) {
                        throw new Error(SignInError.USER_DOESNT_EXIST);
                        throw new Error("User with the specified ID doesn't exist");
                    }
                    if (!user.password) {
                        throw new Error(SignInError.ACCOUNT_NOT_INITIALIZED);
                        throw new Error("User account not yet initialized. Please create a new account with this ID and set a password");
                    }
                    const passwordCorrect = await bcrypt.compare(credentials.password, user.password);
                    if (passwordCorrect) {
                        const {password, otphash, otpexpiration, ...userDetails} = user;
                        return userDetails;
                    }
                    else {
                        throw new Error(SignInError.INCORRECT_PASSWORD);
                        throw new Error("Incorrect Password");
                    }
                }
                catch (error: any) {
                    throw new Error(error);
                }
            }
        })
    ],
    pages: {
        signIn: '/sign-in',
        signOut: '/sign-out',
        error: '/auth/error', // Error code passed in query string as ?error=
        verifyRequest: '/auth/verify-request', // (used for checking email message)
        // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token._id = user.id;
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                
            }
            return session
        },
    },
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET
}