declare namespace google {
  namespace accounts {
    namespace id {
      interface CredentialResponse { credential: string; }
      interface ButtonConfiguration {
        theme?: 'outline' | 'filled_blue' | 'filled_black';
        size?: 'small' | 'medium' | 'large';
        text?: 'signin_with' | 'signup_with' | 'continue_with';
        type?: 'standard' | 'icon';
        logo_alignment?: 'left' | 'center';
      }
      function initialize(options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
      }): void;
      function renderButton(
        parent: HTMLElement,
        options?: ButtonConfiguration
      ): void;
      function prompt(): void;
    }
  }
}