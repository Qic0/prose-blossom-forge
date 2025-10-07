import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

// КРИТИЧЕСКИ ВАЖНО: Детекция режима восстановления с улучшенной логикой
const detectPasswordRecoveryFromURL = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const url = window.location.href;
  
  // Проверяем различные способы передачи токенов восстановления
  const hasRecoveryToken = hash.includes('access_token') && hash.includes('type=recovery');
  const hasRecoveryMode = searchParams.get('mode') === 'reset';
  const hasRecoveryInUrl = url.includes('type=recovery') || url.includes('access_token');
  
  // Дополнительные проверки для токенов в фрагменте URL
  const hasTokenInFragment = hash.includes('token_type') && hash.includes('access_token');
  
  const isRecoveryMode = hasRecoveryToken || hasRecoveryMode || hasRecoveryInUrl || hasTokenInFragment;
  
  console.log('Recovery detection:', {
    hash,
    mode: searchParams.get('mode'),
    hasRecoveryToken,
    hasTokenInFragment,
    isRecoveryMode
  });
  
  return isRecoveryMode;
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, loading } = useAuth();

  // Инициализируем состояние восстановления ДО любых эффектов
  const [isResetMode, setIsResetMode] = useState(() => detectPasswordRecoveryFromURL());
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);
  const [recoveryProcessed, setRecoveryProcessed] = useState(false);

  // Отслеживание изменений URL для режима восстановления
  useEffect(() => {
    const newResetMode = detectPasswordRecoveryFromURL();
    if (newResetMode !== isResetMode) {
      console.log('Reset mode changed:', newResetMode);
      setIsResetMode(newResetMode);
    }
  }, [searchParams, isResetMode]);

  // Простое перенаправление для уже авторизованных пользователей
  useEffect(() => {
    if (!loading && user && !isResetMode && !isProcessingRecovery) {
      console.log('User authenticated, redirecting...');
      const isAdmin = (user as any).role === 'admin';
      navigate(isAdmin ? "/" : "/worker", { replace: true });
    }
  }, [user, loading, navigate, isResetMode, isProcessingRecovery]);

  // Обработка событий восстановления пароля с задержкой
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        
        if (event === "PASSWORD_RECOVERY") {
          console.log('PASSWORD_RECOVERY event - activating reset mode');
          // Задерживаем обработку, чтобы предотвратить конфликты
          setTimeout(() => {
            setIsResetMode(true);
            setIsProcessingRecovery(true);
            setRecoveryProcessed(false);
            toast({
              title: "Готово к сбросу пароля",
              description: "Введите новый пароль ниже",
            });
          }, 100);
        } else if (event === "SIGNED_IN" && isProcessingRecovery) {
          // Не выполняем автоматическое перенаправление при восстановлении пароля
          console.log('SIGNED_IN during recovery - staying on auth page');
        } else if (event === "SIGNED_IN" && !isProcessingRecovery && !detectPasswordRecoveryFromURL()) {
          // Обычный вход - можно перенаправлять
          console.log('Normal SIGNED_IN - allowing redirect');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast, isProcessingRecovery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Предотвращаем повторные вызовы если уже загружается
    if (isLoading) {
      console.log('Login already in progress, ignoring...');
      return;
    }
    
    console.log('Starting login process...');
    setIsLoading(true);
    
    // Добавляем таймаут безопасности для сброса состояния загрузки
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout - resetting loading state');
      setIsLoading(false);
    }, 5000);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      clearTimeout(safetyTimeout);
      
      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        toast({
          title: "Ошибка входа",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Login successful');
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему!"
      });
      
      // Сбрасываем состояние загрузки после успешного входа
      setIsLoading(false);
      
    } catch (error: any) {
      clearTimeout(safetyTimeout);
      console.error('Login failed:', error.message);
      setIsLoading(false);
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) throw error;
      
      toast({
        title: "Письмо отправлено",
        description: "Проверьте почту для восстановления пароля"
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({
        title: "Ошибка",
        description: "Введите новый пароль",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast({
        title: "Пароль обновлен",
        description: "Ваш пароль успешно изменен!"
      });

      // Очистить состояние восстановления и форму
      setPassword("");
      setIsResetMode(false);
      setIsProcessingRecovery(false);
      setRecoveryProcessed(true);
      
      // Принудительно очистить URL от всех параметров восстановления
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState(null, '', cleanUrl);
      
      // Небольшая задержка для обеспечения правильного состояния перед перенаправлением
        setTimeout(() => {
          const isAdmin = (user as any)?.role === 'admin';
          navigate(isAdmin ? "/" : "/worker", { replace: true });
        }, 500);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name
          }
        }
      });
      if (error) throw error;
      
      toast({
        title: "Регистрация успешна",
        description: "Проверьте почту для подтверждения аккаунта"
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="luxury-auth-page">
      <div className="luxury-auth-container luxury-fade-in">
        {/* Brand Section */}
        <div className="luxury-brand-section">
          <h1 className="luxury-logo">Aslan CRM</h1>
          <p className="luxury-tagline">Cистема управления производством мебели</p>
        </div>

        {/* Auth Form Card */}
        <div className="luxury-form-card luxury-slide-up">
          {isResetMode ? (
            // Password Reset Form
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <Lock className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="luxury-form-title">Новый пароль</h2>
                <p className="luxury-form-subtitle">
                  Создайте надежный пароль для защиты вашего аккаунта
                </p>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="luxury-input-group">
                  <label className="luxury-input-label">Новый пароль</label>
                  <div className="luxury-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={6} 
                      className="luxury-input" 
                      placeholder="Минимум 6 символов" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="luxury-input-icon"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button type="submit" className="luxury-button-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="luxury-loading mr-3"></span>
                        Обновление...
                      </span>
                    ) : (
                      "Обновить пароль"
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="luxury-link w-full" 
                    onClick={() => {
                      setIsResetMode(false);
                      setIsProcessingRecovery(false);
                      setRecoveryProcessed(true);
                      setPassword("");
                      window.history.replaceState(null, '', '/auth');
                    }}
                  >
                    Вернуться к входу
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Login/Register Forms
            <div>
              {/* Tab Headers */}
              <div className="flex mb-8 bg-gray-50 rounded-lg p-1">
                <button 
                  type="button" 
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`} 
                  onClick={() => setActiveTab("login")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Вход
                </button>
                <button 
                  type="button" 
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`} 
                  onClick={() => setActiveTab("register")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Регистрация
                </button>
              </div>
              
              {activeTab === "login" ? (
                // Login Form
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="luxury-input-group">
                    <label className="luxury-input-label">Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="luxury-input" 
                      placeholder="your@company.com" 
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-input-label">Пароль</label>
                    <div className="luxury-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="luxury-input" 
                        placeholder="Введите пароль" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="luxury-input-icon"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="luxury-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="rememberMe" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)} 
                      className="luxury-checkbox" 
                    />
                    <label htmlFor="rememberMe" className="luxury-checkbox-label">
                      Запомнить меня
                    </label>
                  </div>
                  
                  <button type="submit" className="luxury-button-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="luxury-loading mr-3"></span>
                        Вход...
                      </span>
                    ) : (
                      "Войти"
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="luxury-link" 
                    onClick={() => {
                      if (!email) {
                        toast({
                          title: "Введите email",
                          description: "Для восстановления пароля необходимо ввести email",
                          variant: "destructive"
                        });
                        return;
                      }
                      handleForgotPassword(email);
                    }}
                  >
                    Забыли пароль?
                  </button>
                </form>
              ) : (
                // Register Form
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="luxury-input-group">
                    <label className="luxury-input-label">Полное имя</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="luxury-input" 
                      placeholder="Иван Петров" 
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-input-label">Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="luxury-input" 
                      placeholder="your@company.com" 
                    />
                  </div>
                  
                  <div className="luxury-input-group">
                    <label className="luxury-input-label">Пароль</label>
                    <div className="luxury-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6} 
                        className="luxury-input" 
                        placeholder="Минимум 6 символов" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="luxury-input-icon"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button type="submit" className="luxury-button-primary" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="luxury-loading mr-3"></span>
                        Создание аккаунта...
                      </span>
                    ) : (
                      "Создать аккаунт"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="luxury-footer">
          <p className="luxury-footer-text">© 2025 Burnatsev Production</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;