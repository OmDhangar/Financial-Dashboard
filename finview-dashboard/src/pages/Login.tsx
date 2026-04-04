import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Login failed";
      const details = err?.response?.data?.error?.details;
      if (details) {
        details.forEach((d: { field: string; message: string }) => {
          form.setError(d.field as any, { message: d.message });
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-foreground">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="admin@example.com" className="bg-secondary border-border" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-secondary border-border pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Quick Access (Demo)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[10px] font-medium border-primary/20 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                onClick={() => {
                  form.setValue("email", "admin@company.com");
                  form.setValue("password", "Password123!");
                }}
              >
                ADMIN
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[10px] font-medium border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300"
                onClick={() => {
                  form.setValue("email", "analyst@company.com");
                  form.setValue("password", "Password123!");
                }}
              >
                ANALYST
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[10px] font-medium border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all duration-300"
                onClick={() => {
                  form.setValue("email", "viewer@company.com");
                  form.setValue("password", "Password123!");
                }}
              >
                VIEWER
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="font-medium text-primary hover:underline transition-all underline-offset-4"
            >
              Register now
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
