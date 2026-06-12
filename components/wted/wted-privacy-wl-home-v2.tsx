import "./wted-privacy-wl-home-v2.css"

export const WTED_PRIVACY_LAST_UPDATED = "06/12/2026"

export function WtedPrivacyWlHomeV2() {
  return (
    <div className="wted-privacy wted-inner-page-bg">
      <header className="wl-home-v2-page-lede">
        <div className="wted-privacy__inner">
          <div className="wted-privacy__title">Privacy Policy</div>
          <div className="wl-home-v2-page-lede-body">
            <p className="wl-home-v2-page-lede-meta">
              Last update{" "}
              <span className="wl-home-v2-page-lede-meta-pill">
                {WTED_PRIVACY_LAST_UPDATED}
              </span>
            </p>
            <p>
              When connecting to the WTED radio stream via browser, mobile app,
              or other device, your IP address will be sent to our radio service
              provider (Radio.co) in order for us to track listening trends and
              provide licensing bodies with royalty reports. Once our service
              provider receives your IP it is immediately anonymized, deleted
              and becomes untraceable. This data is never sold or passed to
              other companies. When you use the WTEDRadio.com website, usage
              data is collected and anonymized to measure interactivity with
              the site&apos;s pages, features, and other assets. Similarly,
              this data is never sold or passed on to other companies.
            </p>
            <div className="wted-privacy__section-title">
              Additional Data Collection For iOS Apps:
            </div>
            <p>
              The WTED Radio iOS App does not collect any user data when
              installed or launched on your device.
            </p>
            <div className="wted-privacy__section-title">
              Additional Data Collection For Android Apps:
            </div>
            <p>
              The WTED Radio Android App does not collect any user data during
              use. In order to provide audio control during Phone App use, the
              App will monitor the &apos;state&apos; of the phone App (Idle, in
              call, call ended) if applicable on your device. At no point will
              the App be able to listen in or derive phone numbers or data.
              Additionally, the Android App also requires access to local
              storage which is used to store its configuration for faster launch
              times.
            </p>
          </div>
        </div>
      </header>
    </div>
  )
}
