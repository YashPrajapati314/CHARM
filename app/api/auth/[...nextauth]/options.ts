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
                        },
                        select: {
                            universityid: true,
                            name: true,
                            email: true,
                            password: true
                        }
                    })
                    if (!user) {
                        throw new Error(SignInError.USER_DOESNT_EXIST);
                    }
                    if (!user.password) {
                        throw new Error(SignInError.ACCOUNT_NOT_INITIALIZED);
                    }
                    const passwordCorrect = await bcrypt.compare(credentials.password, user.password);
                    if (passwordCorrect) {
                        const {password, ...userDetails} = user;
                        return userDetails;
                    }
                    else {
                        throw new Error(SignInError.INCORRECT_PASSWORD);
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
                token.name = user.name;
                token.email = user.email;
                token.universityid = user.universityid;
            }
            return token
        },
        async session({ session, token }) {
            if (token) {

            }
            if (session.user) {
                session.user.universityid = token.universityid;
            }
            return session
        },
    },
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET
}