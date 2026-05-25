import { useState } from 'react';
import { Building2, Users, FileText, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
    onComplete: () => void;
}

export const OnboardingModal = ({ onComplete }: OnboardingModalProps) => {
    const [step, setStep] = useState(1);

    const steps = [
        {
            title: "Welcome to Approveet",
            description: "You've successfully created your workspace. Let's get you started with a quick tour of your new approval engine.",
            icon: <Building2 size={48} strokeWidth={1.5} />
        },
        {
            title: "Build Your Approval Chain",
            description: "Invite Department Heads (HODs) and Account Officers. Assign roles to ensure every request follows the right policy.",
            icon: <Users size={48} strokeWidth={1.5} />
        },
        {
            title: "Control Every Outflow",
            description: "Manage accounts payable, track client receivables, and process staff reimbursement claims in one unified ledger.",
            icon: <FileText size={48} strokeWidth={1.5} />
        }
    ];

    const handleNext = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card onboarding-card">
                <div className="modal-body onboarding-body">
                    <div className="onboarding-icon">
                        {steps[step - 1].icon}
                    </div>
                    <h2 className="onboarding-title">{steps[step - 1].title}</h2>
                    <p className="onboarding-text">{steps[step - 1].description}</p>

                    <div className="onboarding-progress">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`onboarding-dot ${i + 1 === step ? 'active' : ''}`}
                            />
                        ))}
                    </div>

                    <button className="onboarding-btn" onClick={handleNext}>
                        {step === steps.length ? 'Enter Workspace' : 'Continue'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};