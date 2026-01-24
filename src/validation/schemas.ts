import z  from "zod";

export const SignupSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    name: z.string(),
    role: z.enum(["STUDENT", "INSTRUCTOR"])
}).strict();

export const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
}).strict();

export const CreateCourseSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number()  
});

export const EditCourseSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional()  
}).refine((obj) => Object.keys(obj).length !== 0);


export const CreateLessonSchema = z.object({
    title: z.string(),
    content: z.string(),
    courseId: z.uuidv7()
})

export const PurchaseCourseSchema = z.object({
    courseId: z.uuidv7()
})