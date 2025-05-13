import React, { useState } from 'react';
import { LoginForm } from "@/components/login-form"

const Login = () => {

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>

        // <div className="flex items-center justify-center min-h-screen bg-gray-100">
        //     <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
        //         <h2 className="text-2xl font-bold mb-6">Login to QuantFolio</h2>
        //         {error && <p className="text-red-500 mb-4">{error}</p>}
        //         <form onSubmit={handleSubmit} className="space-y-4">
        //             <div>
        //                 <label htmlFor="email" className="block text-sm font-medium">Email</label>
        //                 <input
        //                     id="email"
        //                     type="email"
        //                     value={email}
        //                     onChange={(e) => setEmail(e.target.value)}
        //                     className="w-full p-2 border rounded"
        //                     required
        //                 />
        //             </div>
        //             <div>
        //                 <label htmlFor="password" className="block text-sm font-medium">Password</label>
        //                 <input
        //                     id="password"
        //                     type="password"
        //                     value={password}
        //                     onChange={(e) => setPassword(e.target.value)}
        //                     className="w-full p-2 border rounded"
        //                     required
        //                 />
        //             </div>
        //             <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
        //             <button
        //                 type="button"
        //                 className="w-full p-2 text-blue-600"
        //                 onClick={() => navigate('/register')}
        //             >
        //                 Register
        //             </button>
        //         </form>
        //     </div>
        // </div>
    );
};

export default Login;