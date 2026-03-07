import React, { useState, useRef } from 'react';
import './Auth.css';

const POLICY_TEXT = `DIYcave LLC ("DIYcave"), an Oregon company, and the entity or person identified on the signature page of this agreement ("user"), hereby agree that DIYcave will provide to the user access to the fabrication facilities located at 444 SE 9th St, Bend, OR. This Agreement is a usership Agreement and is not a lease or any other form of tenancy agreement. The DIYcave and user agree as follows:

DIYcave reserves the right to terminate access to and use of DIYcave facilities at any time, immediately and without notice. DIYcave reserves the right to amend the Policies and Procedures from time-to-time and at its sole discretion. Upon the termination of this Agreement, user shall thereafter have no further right to use DIYcave facilities in any manner and user shall make no further use of DIYcave other than to remove personal items. Personal items must be removed from DIYcave within 15 days of the termination of this agreement, after which period they become property of DIYcave.

USER OBLIGATIONS
User shall only use the facilities in accordance with DIYcave Policies and Procedures. The shared facilities shall be kept in a neat, clean and attractive condition at all times. User will not cause any damage to any part of DIYcave, including unreasonable or inappropriate wear on equipment or damage to the building in which DIYcave is located ("Building"). User shall not disturb the use and enjoyment of the Services by any other user of the DIYcave or the use and enjoyment of the Building by any occupant of the Building. User shall not use DIYcave facilities for any inappropriate or unlawful activity including obscenity and use of material protected by intellectual property laws.

FEES
User agrees to make payments in the amount, form and manner as detailed in the DIYcave Policy and Procedures. Failure to make payments as described will result in the termination of this Agreement and revocation of user's access to the facilities. In addition, user shall pay all reasonable third party fees (attorney's fees and debt collection fees specifically included) and other costs incurred by the DIYcave in connection with any late payments or past due amounts.

RISK OF USE
User acknowledges that he/she is using the facilities at his/her own free will and decision. User acknowledges that DIYcave does not have any liability with respect to user's access, participation in, use of the facilities, or any loss resulting from such participation or use.
DIYcave, employees, volunteers, instructors, agents, contractors and officers shall not, to the extent permitted by law, be liable for, and the user waives all right of recovery against DIYcave and such individuals for any damage or claim with respect to any injury to person or damage to, or loss or destruction of, any property of user, its contractors, employees and invitees due to any act, omission or occurrence in or about DIYcave or the Building. Except for the gross or willful misconduct by DIYcave, user agrees to indemnify, defend, protect and hold DIYcave, employees, volunteers, instructors, agents, contractors and officers harmless from and against all claims of whatever nature arising out of user's use of the facilities and occupancy of DIYcave.

INTERRUPTION OF SERVICE
DIYcave shall not be responsible for damages, direct or consequential, which may result from the failure of DIYcave to furnish any Services. DIYcave will, however, act in good faith and in a commercially reasonable manner in working to remedy any flaws in the facilities or equipment, or delays in providing access to the facilities or equipment to the user.

RELATIONSHIP OF THE PARTIES
User is not an employee or contractor of DIYcave. DIYcave has no right to the work produced by users or guests working at DIYcave. Users shall maintain all copyrights, patents and any other proprietary rights related to the user's works that are created using the facilities.

PARTIAL INVALIDITY
If any one or more of the provisions of this Agreement shall be invalid or unenforceable, the remainder of this Agreement shall not be affected, and each remaining provision shall be valid and enforceable to the fullest extent permitted by law.

WAIVER
No delay or omission on the part of DIYcave in exercising any right under this Agreement shall operate as a waiver of such right or of any other right of DIYcave, nor shall any waiver of such right or rights on any one occasion be deemed a bar to, or waiver of, the same right or rights on any future occasion. The acceptance by DIYcave of any payment, or of a sum less than is due, shall not be construed as a waiver of any of DIYcave's rights unless such waiver is in writing.

THIS AGREEMENT IS NOT A LEASE AND DOES NOT CREATE OR REFLECT ANY FORM OF TENANCY OR INTEREST IN REAL PROPERTY IN FAVOR OF THE USER. This Agreement is subject and subordinate to a lease by and between DIYcave and the owner of the Building. This Agreement shall terminate simultaneously with the termination of said lease. This Agreement shall be governed by, interpreted and enforced in accordance with the laws of the State of Oregon.


DIYcave Policies and Procedures

DIYcave strives to provide a safe, productive and fun work environment for its users. In light of this mission, we ask you to obey the following policies and procedures for working in our facility. Failure to obey these policies and procedures can make our facilities dangerous or unwelcoming to others, and such actions on your part may result in your access being terminated without notice. Please take them seriously. We reserve the right to change these policies and procedures as needed and without sufficient notice to users.

FEES
Reservation Fees are due at the time of booking. Reservations are not cancellable but can be moved if notice is received prior to reservation start time.
Surcharge, Breakage and Consumable Fees are due at time incurred and are not refundable.

REFUNDS AND TRANSFERS
We understand that emergencies happen, so if you are unable to attend your class and you cancel with:

More than 14 (fourteen) days notice before your class, you may request a full refund or transfer the full amount paid to another class.
Less than 14 (fourteen) days notice before your class, your payment is non refundable. However you may transfer the amount paid, minus a 15% cancellation fee, to any class within 90 days of request. It is not guaranteed that a comparable class will be offered within 90 days.
Less than 48 (forty eight) hours before your class begins, your payment is non refundable.
Please send all cancellation and change requests to classes@diycave.com

CLASS CANCELLATIONS
DIYcave reserves the right to cancel any class, limit class size, change class times or substitute instructors for those listed in the schedule. If a class is canceled, students may choose to receive a full refund or may transfer – with no fee – to another class or workshop. If DIYcave cancels for any reason, all payments can be refunded.

INDIVIDUAL SAFETY
Always obey all certification requirements, posted signage, shop policies, safe shop practices, techniques for safe equipment use and material-specific precautions for equipment. Do not use equipment you are not certified on, nor comfortable with. Default to asking for help if uncertain.

SHARED SAFETY
In a shared and open facility like ours, it is possible for less experienced users to operate equipment dangerously without knowing it. Please stay on the lookout for unsafe behavior, and approach and offer feedback to fellow users if you believe they are working unsafely. Please notify staff immediately if you believe any piece of equipment or infrastructure to be unsafe.

RESPECTFUL BEHAVIOR
In both in-person and electronic interactions, behave respectfully, courteously, and professionally to your fellow users. No discrimination, harassment, or hate speech shall be tolerated.

COURTESY OF SHARED SPACES
Please respect and do not interrupt any DIYcave activities or classes in the shared spaces.

CLEANING
Users shall restore all areas used to be as clean as or cleaner than when they found them. Cleaning must be done during booked reservation time so as to not interfere or prevent another user from having access to the area they reserved. Brooms, dustpans, shop vacs, brushes, pressurized air hoses and other cleaning supplies are provided and located in multiple places throughout the shop. If shop area is left dirty more than once, usership may be terminated.

GUESTS
User's guests are welcome to visit DIYcave under the following conditions: Must check in and get approval from staff prior to entering shop areas. Must sign a facility waiver. May not use DIYcave equipment/resources. Must not interfere with other users or shop operations. Guests and their actions are the responsibility of the host Maker user. Guests are not allowed in classes.

HELPERS
Users are allowed to have one non-user Helper with them, working on the same project, in the same area of the shop. Helpers pay user rates so long as the following conditions are followed: Helper must check in and sign facility waiver prior to entering shop areas. Helper must be directly assisting the user and in the same area of the shop at all times. Helper is not allowed to use any equipment that requires certification. Helper must not interfere with other users or shop operations. Helpers and their actions are the sole responsibility of the host user.

Adult users are allowed one Youth Helper (ages 8-17) to accompany them while working at the Cave at no additional cost so long as the following conditions are followed: Youth Helper must check in and sign minor facility waiver prior to entering shop areas. Youth Helper must be directly assisting the Maker user and in the same area of the shop at all times. Youth Helper is not allowed to use any equipment that requires certification. Youth Helper must not interfere with other users or shop operations.

YOUTH
Users and classes at DIYcave are open to kids and young adults ages 8 to 17 years. Some classes and equipment require a parent or guardian to be in attendance or on site.

Under 8 years old: No children under 8 years of age are allowed as users or in classes at this time. Children under 8 years of age are restricted to special events and staff-supervised tours.

All Minors: All minors (including guests of users) must have a Minor facility waiver signed by their parent or legal guardian on file before they will be allowed to attend classes or work on-site. Supervising adults must pay for their seat when in-class supervision is required.

Ages 8-11: Minors 8 through 11 years of age are permitted to attend select classes when under the direct supervision of a parent, legal guardian or approved adult. Some classes do require a guardian to enroll in and pay for a seat in the class with children. Minors 8 through 11 years of age must be under the direct supervision of a parent, legal guardian or authorized adult at all times while on-site.

Ages 12-15: Minors 12-15 years of age must have a guardian user present at all times (unless they are in an age approved class with an instructor.) Minors 12-15 years of age may take approved classes without on-site parental supervision.

Ages 16-17: Minors ages 16 and 17 year olds may apply for usership review and be able to access the shop without the presence of a guardian. This requires parental consent and is at the sole discretion of DIYcave management. If not approved, the minor may reapply after private instruction to develop the required skills to use the shop independently. Minors over the age of 16 are eligible to apply for Certification Only tools and equipment.

STORAGE
Storage is reserved for members only. An active, paid membership is required for the entire period of time that items are stored. End of day glue ups/wet finishes may be left in shop overnight and must be removed at the next day's opening without incurring charges. Failure to remove at opening will result in inside shop storage rates.

OVERNIGHT ELECTRICAL USE
Overnight electric usage is reserved for members only.

AUXILIARY POLICIES
DIYcave has several auxiliary policies including, but not limited to: Surcharge Policies (current rates are available at the front desk) and Large Projects (current Large Project Info packet is available at the front desk).`;

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    userType: 'member',
    address: '',
    phone: '',
    birthDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  const [error, setError] = useState('');
  const [policyScrolled, setPolicyScrolled] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const policyRef = useRef(null);

  const handlePolicyScroll = () => {
    const el = policyRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setPolicyScrolled(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && !agreedToPolicy) {
      setError('You must read and agree to the Policy Agreement to sign up.');
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src="/diycave-logo.svg" alt="DIY Cave" className="header-logo" />
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label>Account Type:</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                >
                  <option value="member">Member</option>
                  <option value="non-member">Non-Member</option>
                  <option value="steward">Steward</option>
                  <option value="cave-pro">Cave Pro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label>Address:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Birth Date:</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <h3 className="form-section-header">Emergency Contact</h3>

              <div>
                <label>Contact Name:</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Contact Phone:</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Relationship:</label>
                <select
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          {!isLogin && (
            <div className="policy-section">
              <label className="policy-label">Makerspace Policy Agreement</label>
              <div
                className="policy-scroll-box"
                ref={policyRef}
                onScroll={handlePolicyScroll}
              >
                {POLICY_TEXT.split('\n').map((line, i) =>
                  line.trim() === '' ? <br key={i} /> : <p key={i}>{line}</p>
                )}
              </div>
              {!policyScrolled && (
                <p className="policy-scroll-hint">↓ Scroll to the bottom to accept</p>
              )}
              <label className={`policy-checkbox-label ${!policyScrolled ? 'policy-checkbox-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  disabled={!policyScrolled}
                />
                I have read and agree to the DIYcave Policy Agreement
              </label>
            </div>
          )}

          <button type="submit" disabled={!isLogin && !agreedToPolicy}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="toggle-link">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setPolicyScrolled(false); setAgreedToPolicy(false); }}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;
