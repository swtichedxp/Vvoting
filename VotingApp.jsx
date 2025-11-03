import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';
import { UploadCloud, CheckCircle, XCircle, Trash2, Settings, Plus, LogOut, Loader, User, Zap, Mail, Hash, Shield, BarChart, CreditCard } from 'lucide-react';

// --- 1. FIREBASE & CONTEXT SETUP ---

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'naotems-default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, auth, db;
if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel('debug'); // Enable detailed Firestore logging
}

const AppContext = createContext();

const useApp = () => useContext(AppContext);

// --- 2. DATA PATHS & UTILITIES ---

const ADMIN_EMAIL = "admin@naotems.edu"; // Fixed admin email
const PAYMENT_AMOUNT = "N500"; // Fixed payment amount

const getPollsCollectionPath = () => `/artifacts/${appId}/public/data/polls`;
const getVotesCollectionPath = (pollId) => `/artifacts/${appId}/public/data/polls/${pollId}/votes`;
const getPaymentsCollectionPath = () => `/artifacts/${appId}/public/data/payments`;

// Utility function to generate placeholder image URL (since we can't upload)
const getCandidatePlaceholder = (name) => {
  const parts = name.split(/\s+/);
  const initials = parts.map(p => p[0]).join('');
  const text = initials.slice(0, 2).toUpperCase();
  return `https://placehold.co/100x100/1D4ED8/FDFDFD?text=${text}`;
};

// --- 3. CONTEXT PROVIDER (Main Data Layer) ---

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [polls, setPolls] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Firestore Init & Auth
  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase is not initialized.");
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Custom Auth/Anonymous Sign-in failed:", error);
      }
    };

    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      const isUserAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
      setIsAdmin(isUserAdmin);
      setLoading(false);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Firestore Data Listeners (Polls and Payments)
  useEffect(() => {
    if (!db || !user || loading) return;

    // 1. Polls Listener
    const pollsQuery = query(collection(db, getPollsCollectionPath()));
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      const newPolls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Client-side results processing (simple aggregation for display)
        results: doc.data().candidates.map(c => ({
          ...c,
          count: doc.data().votes?.[c.id] || 0, // Using internal votes map for simplicity
        })).sort((a, b) => b.count - a.count),
      }));
      setPolls(newPolls);
    }, (error) => console.error("Error fetching polls:", error));

    // 2. Payments Listener (Only fetch user's own payments if student, all if admin)
    const paymentsRef = collection(db, getPaymentsCollectionPath());
    let paymentsQuery;
    
    if (isAdmin) {
      // Admin sees ALL payments
      paymentsQuery = query(paymentsRef);
    } else {
      // Student sees only THEIR payments
      paymentsQuery = query(paymentsRef, where("userId", "==", user.uid));
    }

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserPayments(payments);
    }, (error) => console.error("Error fetching payments:", error));

    return () => {
      unsubscribePolls();
      unsubscribePayments();
    };
  }, [db, user, loading, isAdmin]);


  // Authentication Functions
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(error.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email, password, matricNumber) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: email,
        matricNumber: matricNumber,
        isAdmin: email === ADMIN_EMAIL, // Assign admin role if matching
      });
      setUser(userCredential.user);
    } catch (error) {
      console.error("Signup failed:", error);
      throw new Error(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoading(true);
    signOut(auth).then(() => {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    }).catch(error => {
      console.error("Logout failed:", error);
      setLoading(false);
    });
  };

  // Voting & Payment Functions
  const vote = async (pollId, candidateId) => {
    if (!user || !user.uid) return;

    // Check if user has an APPROVED payment
    const approvedPayment = userPayments.find(p => p.status === 'approved' && p.userId === user.uid);
    if (!approvedPayment) {
      alert("You must have an approved payment to vote. Please proceed to the Payment screen.");
      return;
    }
    
    // Check if the user has already voted in this poll
    const pollRef = doc(db, getPollsCollectionPath(), pollId);
    const pollData = polls.find(p => p.id === pollId);
    
    if (pollData && pollData.voters && pollData.voters.includes(user.uid)) {
        alert("You have already voted in this poll.");
        return;
    }

    try {
      // 1. Atomically update the vote count
      await updateDoc(pollRef, {
        [`votes.${candidateId}`]: (pollData.votes?.[candidateId] || 0) + 1,
        voters: arrayUnion(user.uid) // Record voter
      });
      alert("Vote cast successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to cast vote. Please try again.");
    }
  };

  const uploadPaymentProof = async (screenshotUrl) => {
    if (!user || !user.uid) return;

    // Check for pending/approved payment to prevent duplicates
    const existingPayment = userPayments.find(p => p.userId === user.uid && p.status !== 'rejected');
    if (existingPayment) {
      alert(`You already have a payment in '${existingPayment.status}' status.`);
      return;
    }

    try {
      const newPaymentRef = doc(collection(db, getPaymentsCollectionPath()));
      await setDoc(newPaymentRef, {
        userId: user.uid,
        userEmail: user.email,
        amount: PAYMENT_AMOUNT,
        screenshotUrl: screenshotUrl,
        status: 'pending', // pending, approved, rejected
        timestamp: new Date().toISOString(),
      });
      alert("Payment proof uploaded! It is now pending admin approval.");
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      alert("Failed to upload payment proof. Try again.");
    }
  };

  // Admin Functions
  const createNewPoll = async (title, candidates) => {
    try {
      const pollRef = doc(collection(db, getPollsCollectionPath()));
      const initialVotes = candidates.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {});

      await setDoc(pollRef, {
        title: title,
        candidates: candidates, // candidates: [{id: 'c1', name: 'Gemini', img: url}, ...]
        isActive: true,
        votes: initialVotes, // votes: {'c1': 0, 'c2': 0}
        voters: [], // Array of user UIDs who have voted
        createdAt: new Date().toISOString(),
      });
      alert("Poll created successfully!");
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Failed to create poll.");
    }
  };

  const deletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) return;
    try {
      await updateDoc(doc(db, getPollsCollectionPath(), pollId), {
        isActive: false, // Soft delete/Deactivate
      });
      alert("Poll deactivated successfully.");
    } catch (error) {
      console.error("Error deleting poll:", error);
      alert("Failed to delete poll.");
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      const paymentRef = doc(db, getPaymentsCollectionPath(), paymentId);
      await updateDoc(paymentRef, { status: status });
      alert(`Payment ${paymentId} marked as ${status}.`);
    } catch (error) {
      console.error(`Error updating payment status to ${status}:`, error);
      alert("Failed to update payment status.");
    }
  };

  const value = {
    user,
    isAdmin,
    polls,
    userPayments,
    loading,
    handleLogin,
    handleSignup,
    handleLogout,
    vote,
    uploadPaymentProof,
    createNewPoll,
    deletePoll,
    updatePaymentStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


// --- 4. UI COMPONENTS ---

// Helper component for styled buttons
const Button = ({ children, className = '', type = 'button', onClick, disabled = false, icon: Icon, variant = 'primary' }) => {
  const baseClasses = "flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all duration-200 ease-in-out shadow-lg";
  const primaryClasses = "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50";
  const secondaryClasses = "bg-gray-700 hover:bg-gray-600 text-gray-100 shadow-gray-900/50";
  const dangerClasses = "bg-pink-600 hover:bg-pink-500 text-white shadow-pink-900/50";

  let variantClass;
  switch (variant) {
    case 'secondary':
      variantClass = secondaryClasses;
      break;
    case 'danger':
      variantClass = dangerClasses;
      break;
    case 'primary':
    default:
      variantClass = primaryClasses;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {Icon && <Icon size={20} className="mr-2" />}
      {children}
    </button>
  );
};

// Main layout wrapper
const Container = ({ children }) => (
  <div className="min-h-screen bg-[#090D14] text-[#E2E8F0] p-4 font-sans flex flex-col items-center">
    <div className="w-full max-w-md">
      {children}
    </div>
  </div>
);

// --- 4.1 Authentication Screens ---

const AuthCard = ({ title, children }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1E293B] via-[#090D14] to-[#1E293B] p-4">
    <div className="bg-[#1E293B] p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-700/50">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Welcome NAOTEMS!</h1>
        <p className="text-lg font-semibold text-cyan-400">{title}</p>
      </div>
      {children}
    </div>
  </div>
);

const AuthScreen = () => {
  const { handleLogin, handleSignup, loading } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (!isLogin && !matricNumber)) {
      setError('All fields are required.');
      return;
    }
    
    try {
      if (isLogin) {
        await handleLogin(email, password);
      } else {
        await handleSignup(email, password, matricNumber);
      }
    } catch (err) {
      setError(err.message.split('Firebase: ')[1] || 'Authentication failed. Please check your network.');
    }
  };

  return (
    <AuthCard title={isLogin ? "Sign In" : "Create Account"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="email"
          placeholder="Matric/NAOTEMS Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-[#090D14] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
          required
        />
        {!isLogin && (
          <input
            type="text"
            placeholder="Matric Number (e.g., NA001)"
            value={matricNumber}
            onChange={(e) => setMatricNumber(e.target.value)}
            className="w-full p-3 bg-[#090D14] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-[#090D14] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
          required
        />
        
        {error && <p className="text-pink-400 text-center text-sm">{error}</p>}
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
          icon={loading ? Loader : (isLogin ? Shield : Plus)}
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-gray-400">
        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-2 font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </AuthCard>
  );
};

// --- 4.2 Core Application Screens ---

const Header = ({ title, userEmail, onLogout, showAdminButton = false, onAdminClick }) => (
  <header className="flex justify-between items-center p-4 mb-4 bg-[#1E293B] rounded-xl shadow-lg border border-gray-700/50">
    <div>
      <h1 className="text-2xl font-extrabold text-cyan-400">{title}</h1>
      <p className="text-xs text-gray-400">{userEmail}</p>
    </div>
    <div className="flex space-x-2">
      {showAdminButton && (
        <Button variant="secondary" onClick={onAdminClick} className="!px-3 !py-2">
          <Settings size={20} />
        </Button>
      )}
      <Button variant="danger" onClick={onLogout} className="!px-3 !py-2">
        <LogOut size={20} />
      </Button>
    </div>
  </header>
);

// --- Student Screens ---

const PollCard = ({ poll, onVote, user }) => {
  const hasVoted = poll.voters.includes(user.uid);
  const paymentStatus = user.paymentStatus; // We are tracking this via the `userPayments` array

  const totalVotes = Object.values(poll.votes || {}).reduce((sum, count) => sum + count, 0);

  // Check if the user has an approved payment
  const { userPayments } = useApp();
  const approvedPayment = userPayments.find(p => p.status === 'approved' && p.userId === user.uid);
  const canVote = approvedPayment && !hasVoted;
  const showResults = hasVoted || !canVote;
  const disabledMessage = approvedPayment ? "Already Voted" : "Payment Pending/Required";

  return (
    <div className="bg-[#1E293B] p-5 mb-6 rounded-2xl shadow-xl border border-gray-700/50">
      <h2 className="text-xl font-bold mb-4 text-white">{poll.title}</h2>
      <div className="space-y-3">
        {poll.candidates.map((candidate) => {
          const count = poll.votes?.[candidate.id] || 0;
          const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
          const isWinner = showResults && count === poll.results[0].count && totalVotes > 0;
          
          return (
            <div 
              key={candidate.id} 
              className={`flex items-center p-3 rounded-xl transition-all duration-300 ${!showResults && canVote ? 'bg-gray-700 hover:bg-gray-600 active:ring-2 active:ring-cyan-500 cursor-pointer' : ''} ${isWinner ? 'bg-green-800/50 border border-green-500' : 'bg-gray-700/50'}`}
              onClick={() => canVote && onVote(poll.id, candidate.id)}
            >
              <img 
                src={getCandidatePlaceholder(candidate.name)} 
                alt={candidate.name} 
                className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-cyan-500/50"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-white">{candidate.name}</p>
                {candidate.post && <p className="text-xs text-gray-400">{candidate.post}</p>}
              </div>

              {showResults && (
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${isWinner ? 'text-green-400' : 'text-gray-300'}`}>{percentage}%</span>
                  <span className="text-sm text-gray-500">({count})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
        <p className={`font-semibold text-sm ${approvedPayment ? 'text-green-500' : 'text-pink-500'}`}>
          <CheckCircle size={14} className={`inline mr-1 ${approvedPayment ? 'text-green-500' : 'hidden'}`} />
          <CreditCard size={14} className={`inline mr-1 ${!approvedPayment ? 'text-pink-500' : 'hidden'}`} />
          {approvedPayment ? 'Payment Approved' : 'Payment Required'}
        </p>
        {!canVote && (
          <p className="text-xs font-medium text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
            {disabledMessage}
          </p>
        )}
      </footer>
    </div>
  );
};

const StudentDashboard = ({ setView }) => {
  const { user, polls, handleLogout, vote, isAdmin, userPayments } = useApp();
  
  // Find the user's current payment status
  const approvedPayment = userPayments.find(p => p.status === 'approved' && p.userId === user.uid);
  const pendingPayment = userPayments.find(p => p.status === 'pending' && p.userId === user.uid);
  const isPaid = approvedPayment;
  const isPending = pendingPayment;

  return (
    <Container>
      <Header 
        title="NAOTEMS Polls" 
        userEmail={user?.email} 
        onLogout={handleLogout} 
        showAdminButton={isAdmin} 
        onAdminClick={() => setView('admin')}
      />

      <section className="mb-6">
        <div className="bg-[#1E293B] p-5 rounded-2xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <CreditCard size={20} className="mr-2 text-cyan-400" />
              Payment Status
            </h3>
            {isPaid && <CheckCircle size={24} className="text-green-500" />}
            {isPending && <Loader size={24} className="text-yellow-500 animate-spin" />}
            {!isPaid && !isPending && <XCircle size={24} className="text-pink-500" />}
          </div>
          
          <p className="text-gray-400 mb-4">
            {isPaid && "Your payment is approved! You can now vote on all active polls."}
            {isPending && "Your payment proof is pending admin approval. Please wait."}
            {!isPaid && !isPending && `A payment of ${PAYMENT_AMOUNT} is required to validate your votes.`}
          </p>

          {!isPaid && !isPending && (
            <Button className="w-full" onClick={() => setView('payment')}>
              Upload Payment Proof
            </Button>
          )}
        </div>
      </section>

      <h2 className="text-2xl font-bold mb-3 text-white">Active Polls ({polls.filter(p => p.isActive).length})</h2>
      {polls.filter(p => p.isActive).length > 0 ? (
        polls.filter(p => p.isActive).map(poll => (
          <PollCard key={poll.id} poll={poll} onVote={vote} user={user} />
        ))
      ) : (
        <div className="text-center p-10 bg-[#1E293B] rounded-2xl border border-gray-700/50">
          <p className="text-gray-500">No active polls available right now.</p>
        </div>
      )}
    </Container>
  );
};

const PaymentScreen = ({ setView }) => {
  const { user, uploadPaymentProof, userPayments } = useApp();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const currentPayment = userPayments.find(p => p.userId === user.uid);
  const paymentStatus = currentPayment?.status;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 20 * 1024 * 1024) { // Max 20MB
        setUploadError("File size exceeds 20MB limit.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a screenshot to upload.");
      return;
    }
    setLoading(true);
    setUploadError('');
    
    // Simulating file upload to a storage service (we will use a static URL for the demo)
    // In a real app, you would upload this to Firebase Storage first.
    // For this demonstration, we'll use a data URL as a placeholder for the proof image.
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // This is the simulated URL/Data URI that Admin will see
            const simulatedScreenshotUrl = e.target.result; 
            await uploadPaymentProof(simulatedScreenshotUrl);
            setFile(null);
            setView('dashboard');
        } catch (error) {
            setUploadError(error.message);
        } finally {
            setLoading(false);
        }
    };
    reader.onerror = () => {
        setUploadError("Could not read file.");
        setLoading(false);
    };
    reader.readAsDataURL(file); // Reads the file content as a base64 Data URL
  };


  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setView('dashboard')} className="text-cyan-400 hover:text-cyan-300 transition flex items-center">
          <Zap size={20} className="mr-1" /> Back to Polls
        </button>
      </div>

      <div className="bg-[#1E293B] p-6 rounded-2xl shadow-xl border border-gray-700/50">
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
          <CreditCard size={24} className="mr-2 text-pink-400" />
          Payment Validation
        </h2>

        <div className="text-center bg-gray-700/50 p-4 rounded-xl mb-6">
          <p className="text-lg font-semibold text-white">Required Payment: <span className="text-cyan-400">{PAYMENT_AMOUNT}</span></p>
          <p className="text-sm text-gray-400 mt-2">
            **Please pay {PAYMENT_AMOUNT} to the department account and save the proof.**
          </p>
          {/* Placeholder for payment instructions/account details */}
          <div className="mt-3 p-3 bg-gray-800 rounded-lg text-left">
            <p className="text-xs text-gray-300">Account: NAOTEMS Fees Collection</p>
            <p className="text-xs text-gray-300">Bank: Zenith (Example)</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-600 p-8 rounded-xl text-center mb-6">
          <UploadCloud size={32} className="mx-auto text-gray-500 mb-2" />
          <p className="text-gray-400">
            Drop your screenshot here or <label htmlFor="file-upload" className="text-cyan-400 font-semibold cursor-pointer hover:text-cyan-300">browse</label>
          </p>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <p className="text-xs text-gray-500 mt-1">Max. File Size: 20MB (.jpg, .png)</p>
          
          {file && (
            <div className="mt-4 bg-gray-700 p-2 rounded-lg flex justify-between items-center">
              <p className="text-sm text-white truncate">{file.name}</p>
              <CheckCircle size={16} className="text-green-500" />
            </div>
          )}
        </div>
        
        {uploadError && <p className="text-pink-400 text-center text-sm mb-4">{uploadError}</p>}

        {paymentStatus === 'pending' && (
          <p className="text-yellow-400 text-center font-semibold mb-4 flex items-center justify-center">
            <Loader size={16} className="animate-spin mr-2" />
            Your proof is already submitted and pending approval.
          </p>
        )}
        {paymentStatus === 'approved' && (
          <p className="text-green-400 text-center font-semibold mb-4 flex items-center justify-center">
            <CheckCircle size={16} className="mr-2" />
            Your payment is already approved. Go vote!
          </p>
        )}
        {paymentStatus !== 'pending' && paymentStatus !== 'approved' && (
          <Button 
            className="w-full" 
            onClick={handleUpload} 
            disabled={!file || loading}
            icon={loading ? Loader : UploadCloud}
          >
            {loading ? 'Uploading...' : 'Submit Payment Proof'}
          </Button>
        )}
      </div>
    </Container>
  );
};


// --- Admin Screens ---

const PaymentApprovalPanel = () => {
  const { userPayments, updatePaymentStatus } = useApp();

  const pendingPayments = userPayments.filter(p => p.status === 'pending');
  const approvedPayments = userPayments.filter(p => p.status === 'approved');

  return (
    <div className="bg-[#1E293B] p-5 rounded-2xl shadow-xl border border-gray-700/50 mb-6">
      <h3 className="text-xl font-bold mb-4 text-pink-400 flex items-center">
        <CreditCard size={20} className="mr-2" />
        Payment Approvals ({pendingPayments.length} Pending)
      </h3>
      
      {pendingPayments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No payments awaiting approval.</p>
      ) : (
        <div className="space-y-3">
          {pendingPayments.map(payment => (
            <div key={payment.id} className="bg-gray-700/50 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <p className="font-semibold text-white truncate">{payment.userEmail}</p>
                <p className="text-xs text-gray-400">ID: {payment.userId.substring(0, 8)}...</p>
              </div>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <a 
                  href={payment.screenshotUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  View Proof
                </a>
                <Button 
                  variant="primary" 
                  className="!px-3 !py-1 text-sm" 
                  onClick={() => updatePaymentStatus(payment.id, 'approved')}
                >
                  <CheckCircle size={16} />
                </Button>
                <Button 
                  variant="danger" 
                  className="!px-3 !py-1 text-sm" 
                  onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                >
                  <XCircle size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approvedPayments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-gray-400 mb-2">Approved ({approvedPayments.length})</h4>
              <p className="text-sm text-gray-500">Total approved voters: {approvedPayments.length}</p>
          </div>
      )}
    </div>
  );
};

const CreatePollForm = ({ onPollCreate }) => {
  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState([{ id: 'c1', name: '', post: '' }]);
  const [candidateIdCounter, setCandidateIdCounter] = useState(2);

  const addCandidate = () => {
    setCandidates([...candidates, { id: `c${candidateIdCounter}`, name: '', post: '' }]);
    setCandidateIdCounter(candidateIdCounter + 1);
  };

  const removeCandidate = (idToRemove) => {
    setCandidates(candidates.filter(c => c.id !== idToRemove));
  };

  const updateCandidate = (id, field, value) => {
    setCandidates(candidates.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || candidates.some(c => !c.name)) {
      alert("Please provide a poll title and all candidate names.");
      return;
    }
    onPollCreate(title, candidates);
    setTitle('');
    setCandidates([{ id: 'c1', name: '', post: '' }]);
    setCandidateIdCounter(2);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1E293B] p-5 rounded-2xl shadow-xl border border-gray-700/50 mb-6">
      <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center">
        <BarChart size={20} className="mr-2" />
        Create New Poll
      </h3>
      
      <input
        type="text"
        placeholder="Enter Poll Question (e.g., Best AI of the year)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition mb-4"
        required
      />

      <div className="space-y-3 mb-4">
        <label className="text-gray-400 font-semibold">Candidates/Options</label>
        {candidates.map((candidate, index) => (
          <div key={candidate.id} className="flex items-center space-x-2 bg-gray-700 p-3 rounded-xl">
            <User size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder={`Candidate ${index + 1} Name`}
              value={candidate.name}
              onChange={(e) => updateCandidate(candidate.id, 'name', e.target.value)}
              className="flex-1 p-1 bg-transparent border-b border-gray-600 focus:border-cyan-400 text-white placeholder-gray-500 outline-none"
              required
            />
             <input
              type="text"
              placeholder="Post (Optional)"
              value={candidate.post}
              onChange={(e) => updateCandidate(candidate.id, 'post', e.target.value)}
              className="w-1/3 p-1 bg-transparent border-b border-gray-600 focus:border-cyan-400 text-white placeholder-gray-500 outline-none text-sm"
            />
            <button 
              type="button" 
              onClick={() => removeCandidate(candidate.id)}
              className="text-pink-400 hover:text-pink-300 p-1 rounded-full hover:bg-gray-600 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      
      <Button variant="secondary" onClick={addCandidate} type="button" icon={Plus} className="w-full mb-4">
        Add Candidate/Option
      </Button>

      <Button type="submit" variant="danger" icon={Plus} className="w-full">
        Start Poll (Post)
      </Button>
    </form>
  );
};

const AdminPanel = ({ setView }) => {
  const { polls, deletePoll, createNewPoll, handleLogout } = useApp();
  const activePolls = polls.filter(p => p.isActive);
  const inactivePolls = polls.filter(p => !p.isActive);

  return (
    <Container>
      <Header 
        title="Admin Control Panel" 
        userEmail={ADMIN_EMAIL} 
        onLogout={handleLogout} 
        showAdminButton={false} 
      />
      <button onClick={() => setView('dashboard')} className="text-cyan-400 hover:text-cyan-300 transition flex items-center mb-6">
        <Zap size={20} className="mr-1" /> Back to Dashboard
      </button>

      <PaymentApprovalPanel />
      
      <CreatePollForm onPollCreate={createNewPoll} />

      {/* List Active Polls */}
      <h2 className="text-2xl font-bold mb-3 text-white">Manage Active Polls ({activePolls.length})</h2>
      <div className="space-y-4">
        {activePolls.length === 0 ? (
          <p className="text-gray-500 text-center py-4 bg-[#1E293B] rounded-xl">No active polls.</p>
        ) : (
          activePolls.map(poll => (
            <div key={poll.id} className="bg-[#1E293B] p-4 rounded-xl flex justify-between items-center border border-gray-700/50">
              <div className='min-w-0'>
                <p className="font-bold text-white truncate">{poll.title}</p>
                <p className="text-sm text-gray-400">{poll.candidates.length} Options | {poll.voters.length} Votes</p>
              </div>
              <Button 
                variant="danger" 
                className="!px-3 !py-2 text-sm ml-4" 
                onClick={() => deletePoll(poll.id)}
                icon={Trash2}
              >
                Deactivate
              </Button>
            </div>
          ))
        )}
      </div>

       {/* List Inactive/Completed Polls (Optional) */}
       {inactivePolls.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-700">
              <h2 className="text-xl font-bold mb-3 text-gray-500">Inactive Polls ({inactivePolls.length})</h2>
              {/* Optional: Add button to re-activate poll here */}
          </div>
       )}
    </Container>
  );
};


// --- 5. MAIN APP COMPONENT ---

const AppRouter = () => {
  const { user, loading, isAdmin } = useApp();
  const [view, setView] = useState('dashboard'); // dashboard, payment, admin

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090D14] text-cyan-400">
        <Loader size={48} className="animate-spin" />
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <AuthScreen />;
  }
  
  // Logic to determine the active screen
  let CurrentScreen;
  if (isAdmin && view === 'admin') {
    CurrentScreen = AdminPanel;
  } else if (view === 'payment') {
    CurrentScreen = PaymentScreen;
  } else {
    // Default to student dashboard
    CurrentScreen = StudentDashboard;
  }

  return <CurrentScreen setView={setView} />;
};

// Default export
export default function App() {
  // Check for firebase config availability before rendering
  if (!firebaseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090D14] text-pink-500 p-4 text-center">
        <p>
          <XCircle size={24} className="inline mr-2" /> 
          FATAL ERROR: Firebase configuration (__firebase_config) is missing.
          Please ensure your environment is correctly set up.
        </p>
      </div>
    );
  }
  
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
