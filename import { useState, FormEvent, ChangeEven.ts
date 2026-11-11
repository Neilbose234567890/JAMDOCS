import { useState, FormEvent, ChangeEvent } from "react";

interface FormData {
  fullname: string;
  email: string;
  password: string;
  confirmpassword: string;
  dateofbirth: string;
  acceptterms: string;
}

interface FormErrors {
  fullname: string;
  email: string;
  password: string;
  confirmpassword: string;
  dateofbirth: string;
  acceptterms: string;
}

export default function MyForm() {
  const [formData, setFormData] = useState<FormData>({ fullname: "", email: "", password: "", confirmpassword: "", dateofbirth: "", acceptterms: "" });
  const [errors, setErrors] = useState<FormErrors>({ fullname: "", email: "", password: "", confirmpassword: "", dateofbirth: "", acceptterms: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = { fullname: "", email: "", password: "", confirmpassword: "", dateofbirth: "", acceptterms: "" };
    if (!formData.fullname) errors.fullname = "FullName is required";
      if (!formData.email) errors.email = "Email is required";
      if (formData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}$/i.test(formData.email)) {
            errors.email = "Invalid email address";
          }
      if (!formData.password) errors.password = "Password is required";
      if (formData.password && formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters";
          }
      if (!formData.confirmpassword) errors.confirmpassword = "ConfirmPassword is required";
      if (formData.confirmpassword && formData.confirmpassword.length < 8) {
            errors.confirmpassword = "Password must be at least 8 characters";
          }
      if (!formData.acceptterms) errors.acceptterms = "AcceptTerms is required";
    setErrors(errors);
    return Object.values(errors).every(error => !error);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked.toString() : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', formData);
      setFormData({ fullname: "", email: "", password: "", confirmpassword: "", dateofbirth: "", acceptterms: "" });
      setErrors({ fullname: "", email: "", password: "", confirmpassword: "", dateofbirth: "", acceptterms: "" });
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-gray-800">
            Full Name
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Please fill in the required information
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="mb-4">
          <label htmlFor="fullname" className="block text-sm font-medium text-gray-600 mb-1">
            FullName *
          </label>
          <input
            type="text"
            id="fullname"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange} required
            className={`w-full px-3 py-2 border ${
              errors.fullname ? 'border-red-400' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:border-blue-400 transition-colors`}
          />
          {errors.fullname && (
            <p className="mt-1 text-sm text-red-500">{errors.fullname}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange} required
            className={`w-full px-3 py-2 border ${
              errors.email ? 'border-red-400' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:border-blue-400 transition-colors`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange} required
            className={`w-full px-3 py-2 border ${
              errors.password ? 'border-red-400' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:border-blue-400 transition-colors`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="confirmpassword" className="block text-sm font-medium text-gray-600 mb-1">
            ConfirmPassword *
          </label>
          <input
            type="password"
            id="confirmpassword"
            name="confirmpassword"
            value={formData.confirmpassword}
            onChange={handleChange} required
            className={`w-full px-3 py-2 border ${
              errors.confirmpassword ? 'border-red-400' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:border-blue-400 transition-colors`}
          />
          {errors.confirmpassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmpassword}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="dateofbirth" className="block text-sm font-medium text-gray-600 mb-1">
            DateOfBirth
          </label>
          <input
            type="date"
            id="dateofbirth"
            name="dateofbirth"
            value={formData.dateofbirth}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${
              errors.dateofbirth ? 'border-red-400' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:border-blue-400 transition-colors`}
          />
          {errors.dateofbirth && (
            <p className="mt-1 text-sm text-red-500">{errors.dateofbirth}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="acceptterms"
              checked={formData.acceptterms === "true"}
              onChange={handleChange} required
              className={`rounded ${
                errors.acceptterms ? 'border-red-400' : 'border-gray-200'
              } text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors`}
            />
            <span className="ml-2 text-sm text-gray-600">AcceptTerms *</span>
          </label>
          {errors.acceptterms && (
            <p className="mt-1 text-sm text-red-500">{errors.acceptterms}</p>
          )}
        </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}